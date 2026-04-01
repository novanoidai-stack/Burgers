---
name: Análisis Exhaustivo F1+F2
description: Análisis completo de fases 1 y 2 buscando fallos lógicos, inconsistencias de coherencia y problemas de seguridad (2026-04-01)
type: project
---

# 📊 ANÁLISIS EXHAUSTIVO F1+F2 - RESULTADOS

**Fecha**: 2026-04-01
**Estado**: Fases 1 y 2 analizadas exhaustivamente
**Compilación**: 0 errores TypeScript
**Tests**: 37/37 PASS
**Archivos analizados**: 18 TypeScript + 11 tests + config

---

## 🚨 FALLOS LÓGICOS CRÍTICOS ENCONTRADOS

### **P0 - CRÍTICO: Race Condition en voice.ts**

**Ubicación**: `src/routes/voice.ts:49`
**Código**:
```typescript
const input = normalizeVoiceInput(restaurantSlug, streamSid || 'unknown', transcript, callerNumber);
```

**Problema**:
- Si `streamSid` está vacío al inicio de la llamada (antes de evento 'start'), se usa 'unknown' como sessionId
- Session se crea con sessionId 'unknown' en BD
- Cuando llega evento 'start', se crea NUEVA sesión con streamSid correcto
- **Resultan dos sesiones para la misma llamada**

**Impacto**: Data corruption, sesiones huérfanas, tracking incorrecto

**Reproducción**:
1. Llegada transcript inmediatamente → session 'unknown'
2. Llegada evento 'start' → nueva sesión con streamSid real
3. Dos sesiones en BD para misma llamada

**Solución**:
```typescript
// Solución: No procesar transcripts hasta tener streamSid válido
if (!streamSid) return; // Esperar evento 'start' primero
const input = normalizeVoiceInput(restaurantSlug, streamSid, transcript, callerNumber);
```

---

### **P0 - CRÍTICO: Session Race Condition en llmOrchestrator.ts**

**Ubicación**: `src/services/llmOrchestrator.ts:205`
**Código**:
```typescript
const { toolResult, orderUpdate, triggerPayment: tp } = applyToolCall(call as unknown as ToolCall, { ...session, order_draft: orderDraftUpdate }, products);
```

**Problema**:
- Se hace `{ ...session, order_draft: orderDraftUpdate }` (shallow copy)
- `applyToolCall` muta directamente `session.order_draft.items`
- **En concurrencia, múltiples llamadas pueden corromper datos**

**Impacto**: Data corruption en pedidos concurrentes

**Reproducción**:
1. Llamada A → processMessage → muta session.order_draft
2. Llamada B → processMessage → muta session.order_draft (sobreescribe cambios de A)

**Solución**:
```typescript
// Solución: Deep clone para evitar mutación compartida
const sessionCopy = {
  ...session,
  order_draft: {
    ...session.order_draft,
    items: [...session.order_draft.items], // Deep clone array
  }
};
const { toolResult, orderUpdate, triggerPayment: tp } = applyToolCall(call, sessionCopy, products);
```

---

### **P1 - ALTO: Missing Error Handling en paymentService.ts**

**Ubicación**: `src/services/paymentService.ts:32`
**Código**:
```typescript
const session = await stripe.checkout.sessions.create({
```

**Problema**:
- No hay try/catch alrededor de `stripe.checkout.sessions.create()`
- Si Stripe API falla, timeout, o error de red → crash del servidor
- Logs de error no capturados apropiadamente

**Impacto**: Servidor inestable, pérdida de pagos

**Reproducción**:
1. Stripe API timeout → servidor crash sin recovery
2. Error de red → crash silencioso

**Solución**:
```typescript
// Solución: Try/catch con logging y retry
try {
  const session = await stripe.checkout.sessions.create({...});
  if (!session.url) throw new Error('Stripe session has no URL');
  return session.url;
} catch (err) {
  console.error('[paymentService] Stripe error:', err.message);
  // Distinguir entre errores temporales (retry) y permanentes (fail)
  if (err instanceof Stripe.errors.StripeAPIError) {
    if (err.code === 'timeout' || err.code === 'rate_limit') {
      // Retry con exponential backoff
    }
  }
  throw err;
}
```

---

### **P1 - ALTO: Inconsistencia de Identificación de Sesión en voice.ts**

**Ubicación**: `src/routes/voice.ts:63`
**Código**:
```typescript
const session = await getOrCreateSessionByPhone(restaurantSlug, callerNumber || streamSid, 'voice');
```

**Problema**:
- Si `callerNumber` está vacío (no disponible en SIP headers), se usa `streamSid` como fallback
- Pero `streamSid` puede ser único por llamada, no por usuario
- **Misma persona con llamadas diferentes crea múltiples sesiones**

**Impacto**: Sesiones duplicadas, tracking incorrecto, datos inconsistentes

**Reproducción**:
1. Llamada 1: +34600000001 → session con streamSid 'CA123'
2. Llamada 2: mismo número → session con streamSid 'CA456' (diferente, pero mismo usuario)

**Solución**:
```typescript
// Solución: Priorizar callerNumber, validar ambos
if (!callerNumber && !streamSid) {
  console.warn('[voice] Neither callerNumber nor streamSid available - skipping session management');
  return;
}
const session = await getOrCreateSessionByPhone(restaurantSlug, callerNumber || streamSid, 'voice');
```

---

### **P1 - ALTO: Falta Validación de Transiciones de Estado**

**Ubicación**: Múltiples archivos (sessionManager, llmOrchestrator, voice, whatsapp, stripeWebhook)
**Problema**:
- No hay validación de que las transiciones de estado sean válidas
- Cualquier componente puede cambiar `status` a cualquier valor sin restricción
- State machine no protegido

**Transiciones esperadas**:
```
greeting → taking_order → confirming → awaiting_payment → paid/done/abandoned
```

**Transiciones peligrosas posibles**:
- `paid → taking_order` (revivir pedido pagado)
- `awaiting_payment → greeting` (resetear sin confirmar)
- Cualquier salto no secuencial

**Impacto**: Inconsistencia de estado de pedidos, potencial fraude

**Reproducción**:
1. Error en código cambia `paid → greeting` → pedido pagado se resetea
2. Cliente puede explotar saltos de estado

**Solución**:
```typescript
// Solución: Validador de transiciones de estado
type ConversationStatus = 'greeting' | 'taking_order' | 'confirming' | 'awaiting_payment' | 'paid' | 'done' | 'abandoned';

const VALID_TRANSITIONS: Record<ConversationStatus, ConversationStatus[]> = {
  greeting: ['taking_order'],
  taking_order: ['confirming', 'awaiting_payment'],
  confirming: ['awaiting_payment', 'paid'],
  awaiting_payment: ['paid', 'done', 'abandoned'],
  paid: ['done'], // Terminal state
  done: [], // Terminal state
  abandoned: [], // Terminal state
};

function validateTransition(from: ConversationStatus, to: ConversationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function updateSession(
  tenantSlug: string,
  sessionId: string,
  newStatus: ConversationStatus,
  // ... otros campos
): Promise<void> {
  const current = await getSessionById(tenantSlug, sessionId);
  if (!current) throw new Error('Session not found');

  if (!validateTransition(current.status, newStatus)) {
    throw new Error(`Invalid transition: ${current.status} → ${newStatus}`);
  }

  // ... update con validación
}
```

---

### **P2 - MEDIO: Falta Idempotency en Stripe**

**Ubicación**: `src/services/paymentService.ts:32`
**Problema**:
- `stripe.checkout.sessions.create()` sin `idempotency_key`
- Si cliente recarga página → **doble cobro**
- Mismo pedido, mismo usuario → 2 cobros en tarjeta

**Impacto**: Fraude potencial, disputas de chargeback

**Reproducción**:
1. Cliente confirma pedido → Payment Link generado
2. Cliente recarga → mismo sessionId, nuevo Payment Link → 2 cobros

**Solución**:
```typescript
// Solución: Usar order_id como idempotency_key
await stripe.checkout.sessions.create({
  idempotency_key: orderId, // Prevé doble cobro
  // ... otros parámetros
});
```

---

### **P2 - MEDIO: Falta Rate Limiting**

**Ubicación**: `src/routes/voice.ts`, `src/routes/whatsapp.ts`, `src/routes/stripeWebhook.ts`
**Problema**:
- No hay rate limiting en NINGÚN endpoint público
- Ataque de DoS puede saturar servidor
- Abuso de API externa (Stripe, OpenRouter, ElevenLabs)

**Impacto**: Vulnerabilidad de seguridad, sobrecarga de recursos

**Reproducción**:
1. Script automatizado llama 1000x/segundo
2. Ataque a endpoint de WhatsApp
3. Abuso de Stripe checkout creation

**Solución**:
```typescript
// Solución: Rate limiting middleware
import rateLimit from 'express-rate-limit';

// Para endpoints de voz/whatsapp
const voiceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máx 30 llamadas/minuto por tenant
  message: 'Too many calls, please try again later',
});

wsApp.use('/voice/:restaurantSlug', voiceRateLimit, (ws, req) => {
  // ... handler
});

// Para Stripe webhook (más restrictivo)
const stripeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 webhooks/minuto por tenant
  skipSuccessfulRequests: true,
});
```

---

### **P2 - MEDIO: Falta Input Validation**

**Ubicación**: `src/services/inputNormalizer.ts`, `src/routes/voice.ts`, `src/routes/whatsapp.ts`
**Problema**:
- No hay validación de longitud máxima en campos de texto
- Transcripción de Deepgram puede ser gigantesca (10k+ caracteres)
- Mensajes de WhatsApp sin límite de longitud
- Ataque de DoS por payload masivo

**Impacto**: Vulnerabilidad de seguridad, saturación de memoria, sobrecarga de LLM

**Reproducción**:
1. Deepgram envía transcript de 10k caracteres
2. LLM procesa 10k tokens → coste enorme
3. Memoria del servidor saturada

**Solución**:
```typescript
// Solución: Validación de longitud de entrada
const MAX_TEXT_LENGTH = 2000; // 2000 caracteres máximo

export function normalizeVoiceInput(
  tenantSlug: string,
  callSid: string,
  transcript: string,
  phoneNumber: string,
): NormalizedInput | null {
  const text = transcript.trim();

  // Validación de longitud
  if (text.length > MAX_TEXT_LENGTH) {
    console.warn('[inputNormalizer] Text too long, truncating:', text.length);
    return { tenantSlug, sessionId: callSid, channel: 'voice', text: text.substring(0, MAX_TEXT_LENGTH), phoneNumber };
  }

  if (!text) return null;
  return { tenantSlug, sessionId: callSid, channel: 'voice', text, phoneNumber };
}
```

---

### **P2 - MEDIO: Falta Timeout Handling en WebSockets**

**Ubicación**: `src/routes/voice.ts:39`
**Problema**:
- WebSocket puede colgar sin limpieza de recursos
- Si cliente se desconecta bruscamente, Deepgram sigue corriendo
- No hay timeout para desconexiones inactivas

**Impacto**: Memory leaks, consumo de API innecesario, sobrecarga de servidor

**Reproducción**:
1. Cliente cuelga tras 10s → WebSocket cerrado
2. Deepgram sigue enviando audio al stream muerto (30 minutos)
3. Memory del servidor lleno con streams zombies

**Solución**:
```typescript
// Solución: Timeout y cleanup de WebSockets
const WEBSOCKET_TIMEOUT = 60 * 1000; // 60 segundos sin actividad = timeout
const DEEPGRAM_INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutos sin audio = timeout

let lastActivity = Date.now();
let inactivityTimer: NodeJS.Timeout;

ws.on('message', () => {
  lastActivity = Date.now();
  resetInactivityTimer();
});

ws.on('close', () => {
  if (!dgFinished) {
    dgFinished = true;
    dgLive.finish();
  }
  clearTimeout(inactivityTimer);
});

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    console.log(`[voice] Inactivity timeout, closing connection`);
    ws.close(1000, 'Inactivity timeout');
  }, DEEPGRAM_INACTIVITY_TIMEOUT);
}
```

---

### **P2 - MEDIO: Falta Retry Logic con Exponential Backoff**

**Ubicación**: `src/services/paymentService.ts`, `src/services/llmOrchestrator.ts`, `src/services/outputRouter.ts`
**Problema**:
- No hay retry logic con exponential backoff para servicios externos
- Si Stripe, OpenRouter, ElevenLabs fallan una vez → error inmediato
- Sin distinguir errores temporales vs permanentes

**Impacto**: Sistema frágil, pérdida de transacciones por errores transitorios

**Reproducción**:
1. Stripe timeout (5s) → error permanente
2. OpenRouter rate limit (429) → sin reintento
3. ElevenLabs service down → crash inmediato

**Solución**:
```typescript
// Solución: Retry con exponential backoff
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: string[];
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;

      // No reintentar si no es error configurable
      if (!config.retryableErrors.some(code => err.message.includes(code))) {
        throw err;
      }

      // Exponential backoff
      const delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt),
        config.maxDelayMs
      );

      console.log(`[retry] Attempt ${attempt + 1}/${config.maxRetries}, retrying in ${delay}ms:`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Para Stripe payment creation
await fetchWithRetry(
  () => stripe.checkout.sessions.create({...}),
  {
    maxRetries: 3,
    baseDelayMs: 1000, // 1s
    maxDelayMs: 10000, // 10s
    retryableErrors: ['timeout', 'ECONNREFUSED', 'ETIMEDOUT'],
  }
);
```

---

### **P2 - MEDIO: Falta Structured Logging**

**Ubicación**: Todos los archivos del proyecto
**Problema**:
- `console.log`/`console.error` sin contexto estructurado
- No hay request ID para tracing
- No hay niveles de logging (info, warn, error, debug)
- Difícil de debuggear en producción

**Impacto**: Debugging ineficiente, tracking de problemas imposible

**Reproducción**:
1. Error en producción → logs sin contexto
2. Múltiples usuarios → imposible distinguir requests
3. Performance profiling → datos de latencia perdidos

**Solución**:
```typescript
// Solución: Structured logging con Winston
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'logs/app.log' }),
  ],
});

// Generar request ID único por llamada
import { randomUUID } from 'crypto';

export function logWithRequest(message: string, level: 'info' | 'warn' | 'error', metadata?: Record<string, any>) {
  const requestId = randomUUID();
  logger[level]({
    message,
    requestId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

// Uso en código:
logWithRequest('Voice transcript received', 'info', {
  tenant: restaurantSlug,
  streamSid,
  transcriptLength: transcript.length,
});

logWithRequest('Stripe error', 'error', {
  orderId,
  errorCode: err.code,
  errorMessage: err.message,
  stack: err.stack,
});
```

---

## 🔄 COHERENCIA ENTRE COMPONENTES

### **Coherencia: Manejo de Erros Inconsistente**

| Componente | Error Handling | Status |
|-----------|----------------|--------|
| `paymentService.ts` | ❌ No try/catch | CRÍTICO |
| `llmOrchestrator.ts` | ✅ Try/catch presente | OK |
| `outputRouter.ts` | ✅ Try/catch presente | OK |
| `sessionManager.ts` | ❌ No try/catch | ACEPTABLE |
| `voice.ts` | ✅ Try/catch en main loop | OK |
| `whatsapp.ts` | ✅ Try/catch en handler | OK |

**Inconsistencia**: `paymentService` no tiene error handling mientras que otros servicios sí

---

### **Coherencia: Transiciones de Estado**

| Estado | Componentes que lo usan | Validación de transiciones |
|--------|------------------------|--------------------------|
| `greeting` | sessionManager (default), llmOrchestrator | ❌ SIN VALIDACIÓN |
| `taking_order` | voice, whatsapp, llmOrchestrator | ❌ SIN VALIDACIÓN |
| `confirming` | llmOrchestrator | ❌ SIN VALIDACIÓN |
| `awaiting_payment` | voice, whatsapp, stripeWebhook | ❌ SIN VALIDACIÓN |
| `paid` | stripeWebhook | ⚠️ ESTADO FINAL (sin validación ok) |
| `done`, `abandoned` | No se usan activamente | - |

**Inconsistencia**: State machine no protegido, transiciones arbitrarias posibles

---

### **Coherencia: Manejo de Sesiones**

| Aspecto | voice.ts | whatsapp.ts | stripeWebhook.ts | sessionManager.ts |
|---------|-----------|-------------|-----------------|----------------|
| `sessionId` source | streamSid ❌ | from ✅ | metadata ✅ | parameter ✅ |
| Consistencia sessionId | ❌ **INCONSISTENTE** | ✅ | ✅ | - |
| Race condition handling | ❌ | ❌ | ✅ | ❌ |
| Cleanup de sesiones | ❌ | ❌ | ❌ | ❌ |

**Inconsistencia CRÍTICA**: `voice.ts` usa `streamSid` como sessionId fallback, creando sesiones duplicadas

---

## 🔐 SEGURIDAD

### **Vulnerabilidades Identificadas**

| Vulnerabilidad | Severidad | Componente | Mitigación |
|--------------|-----------|-----------|-----------|
| **Sin Rate Limiting** | 🔴 HIGH | voice, whatsapp, stripeWebhook | Implementar rate limiting |
| **Sin Input Validation** | 🟡 MEDIUM | inputNormalizer, voice, whatsapp | Validar longitud máxima |
| **Sin Idempotency** | 🟡 MEDIUM | paymentService | Añadir idempotency_key |
| **State Machine No Protegido** | 🟡 MEDIUM | sessionManager, llmOrchestrator | Validar transiciones |
| **Race Conditions** | 🔴 HIGH | voice, llmOrchestrator | Implementar deep clone/mutex |
| **No Timeout Handling** | 🟡 MEDIUM | voice (WebSocket) | Implementar timeouts |
| **Error Handling Inconsistente** | 🟡 MEDIUM | paymentService | Añadir try/catch |
| **No Retry Logic** | 🟡 MEDIUM | Todos servicios | Implementar exponential backoff |
| **Sin Structured Logging** | 🟢 LOW | Todo el proyecto | Implementar Winston/Pino |

---

## 📋 COBERTURA DE TESTS

### **Tests Existentes: 37/37 PASS**

| Categoría | Tests | Coverage | Gaps |
|----------|-------|----------|-------|
| **Unit Tests** | 25 | ✅ Bien | ❌ Falta: edge cases de concurrencia |
| **Integration Tests** | 12 | ✅ Bien | ❌ Falta: stress tests, tests de carga |
| **E2E Tests** | 0 | ❌ NO EXISTEN | ❌ CRÍTICO |

**Gaps Críticos**:
1. ❌ No tests de race conditions
2. ❌ No tests de transiciones de estado inválidas
3. ❌ No tests de payload masivo (DoS)
4. ❌ No tests de recuperación de errores
5. ❌ No tests de latency budget (1.5s)

---

## 🎯 MATRIZ DE PRIORIDADES

### **P0 - CRÍTICO (Bloqueadores de Producción)**

| # | Issue | Archivo | Complejidad | Timeline |
|---|-------|---------|------------|----------|
| 1 | Race Condition voice streamSid | voice.ts:49 | BAJA | 1h |
| 2 | Race Condition llmOrchestrator | llmOrchestrator.ts:205 | MEDIA | 2h |
| 3 | Missing Error Handling paymentService | paymentService.ts:32 | MEDIA | 1h |

### **P1 - HIGH (Bloqueadores Funcionales)**

| # | Issue | Archivo | Complejidad | Timeline |
|---|-------|---------|------------|----------|
| 4 | Session ID inconsistency | voice.ts:63 | BAJA | 1h |
| 5 | State transition validation | Múltiples | MEDIA | 3h |
| 6 | Idempotency | paymentService.ts:32 | BAJA | 1h |
| 7 | Input validation | inputNormalizer.ts | BAJA | 30min |

### **P2 - MEDIUM (Technical Debt)**

| # | Issue | Archivo | Complejidad | Timeline |
|---|-------|---------|------------|----------|
| 8 | Rate limiting | Múltiples | MEDIA | 2h |
| 9 | Timeout handling WebSockets | voice.ts:39 | MEDIA | 2h |
| 10 | Retry logic exponential backoff | Múltiples | MEDIA | 3h |
| 11 | Structured logging | Todo el proyecto | MEDIA | 2h |
| 12 | E2E tests | testing/ | ALTA | 1 día |

---

## 📊 RESUMEN DE SEVERIDAD

- **P0 (CRITICAL)**: 3 issues - Deben corregirse ANTES de cualquier deployment
- **P1 (HIGH)**: 4 issues - Deben corregirse antes de F3 producción
- **P2 (MEDIUM)**: 5 issues - Pueden ser F3 tasks

**Tiempo estimado para fixes P0-P1**: ~5 horas
**Tiempo estimado para P2 completo**: ~1 día + medio

---

## 🚨 CONCLUSIÓN

**Estado de F1+F2**:
- ✅ **Tests PASS** (37/37)
- ✅ **Compilación OK** (0 errores)
- 🔴 **FALLOS CRÍTICOS** (3 P0 + 4 P1 + 5 P2)
- ⚠️ **Technical Debt significativo** identificado

**Recomendación**:
1. **CORREGIR P0 ANTES de T13 smoke test** (voice race conditions, payment error handling)
2. **DOCUMENTAR findings exhaustivamente** en memoria
3. **COMPLETAR F2 solo cuando P0 estén fixeados**
4. **Address P1-P2 durante F3** como tasks oficiales

**Proyecto está técnicamente SÓLIDO pero tiene fallos lógicos críticos que deben corregirse.**
