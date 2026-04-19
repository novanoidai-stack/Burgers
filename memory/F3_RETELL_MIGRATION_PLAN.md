---
name: F3 Retell AI Migration Plan
description: Plan completo para migrar capa de voz de Twilio+Deepgram+ElevenLabs a Retell AI Custom LLM
type: project
---

# F3: Migración de Voz a Retell AI — Plan Aprobado

**Fecha**: 2026-04-05
**Status**: Planificado, listo para ejecutar
**Duración estimada**: 3 horas (6 tasks)
**Plan completo**: `docs/superpowers/plans/cosmic-shimmying-flame.md`

---

## 🎯 Objetivo

Reemplazar la capa de voz actual (Twilio Media Streams + Deepgram STT + ElevenLabs TTS) por Retell AI en modo Custom LLM, manteniendo:
- Claude 3.5 Sonnet como cerebro LLM ✅
- WhatsApp + Stripe intactos ✅
- Supabase + SessionManager ✅

---

## 🏗️ Nueva Arquitectura

```
Llamada telefónica
    ↓
Retell AI (gestiona STT/TTS/telefonía)
    ↓ POST /retell/llm-webhook
Servidor Node.js
    ├── InputNormalizer
    ├── SessionManager
    ├── LLMOrchestrator (Claude 3.5 Sonnet)
    └── PaymentService
    ↓ { response_id, content: "texto" }
Retell AI
    ↓ Síntesis a voz (internamente)
Cliente escucha respuesta
```

**Ventajas:**
- Gestión de STT/TTS delegada a Retell (menos overhead)
- Endpoint HTTP simple en lugar de WebSocket complejo
- Control total sobre LLM (Claude) mientras Retell maneja la telefonía
- Arquitectura más similar a la de Barbería (n8n webhook)

---

## 📝 Cambios en Archivos

### ELIMINAR
- `src/routes/voice.ts` — WS handler Twilio + Deepgram (127 líneas)
- `src/routes/twiml.ts` — TwiML generator (26 líneas)

### CREAR
- `src/routes/retell.ts` — Custom LLM webhook endpoint
- `tests/unit/retellWebhook.test.ts` — Tests unitarios
- `tests/integration/routes/retell.test.ts` — Tests integración

### MODIFICAR
| Archivo | Cambio |
|---------|--------|
| `src/config/env.ts` | Quitar Deepgram required, agregar Retell, quitar Twilio/ElevenLabs |
| `src/services/outputRouter.ts` | Eliminar `buildTwilioAudioMessage()`, `estimateAudioDurationMs()`, `synthesizeAndSendVoice()`. Mantener `sendWhatsAppText()` |
| `src/app.ts` | Quitar express-ws, registrar retell router, eliminar voice routes y twiml |
| `tests/unit/outputRouter.test.ts` | Actualizar tests (solo `sendWhatsAppText`) |
| `tests/setup.ts` | Quitar DEEPGRAM_API_KEY |
| `package.json` | Eliminar @deepgram/sdk, twilio, express-ws. Agregar retell-sdk |
| `.env.example` | Reemplazar Twilio+Deepgram+ElevenLabs con Retell vars |
| `docs/vault/current.md` | Documentar F3 completado |

---

## 📋 6 Tasks (Secuenciales)

### Task 1: Limpiar dependencias y env vars (30 min)
- [ ] Actualizar `package.json` — quitar deps, agregar `retell-sdk`
- [ ] Ejecutar `npm install`
- [ ] Reescribir `src/config/env.ts` completo
- [ ] Actualizar `tests/setup.ts`
- [ ] Verificar compilación TypeScript
- [ ] Commit

### Task 2: Limpiar outputRouter (20 min)
- [ ] Escribir test nuevo para `sendWhatsAppText`
- [ ] Reescribir `src/services/outputRouter.ts` (eliminar funciones de voz)
- [ ] Actualizar `tests/unit/outputRouter.test.ts`
- [ ] Tests pasan ✅
- [ ] Commit

### Task 3: Crear endpoint Retell (40 min)
- [ ] Escribir tests unitarios (`retellWebhook.test.ts`)
- [ ] Crear `src/routes/retell.ts` con:
  - `extractLastUserMessage()` 
  - `buildRetellResponse()`
  - Router con `POST /retell/llm-webhook`
  - Manejo de `call_started`, `response_required`, `call_ended`
  - Integración con SessionManager, LLM, PaymentService
- [ ] Tests unitarios pasan
- [ ] Commit

### Task 4: Registrar Retell en app y eliminar obsoletos (20 min)
- [ ] Reescribir `src/app.ts` — agregar retell router, quitar express-ws
- [ ] Eliminar `src/routes/voice.ts` y `src/routes/twiml.ts`
- [ ] Compilación TypeScript ✅
- [ ] Todos los tests pasan ✅
- [ ] Commit

### Task 5: Tests de integración (30 min)
- [ ] Crear `tests/integration/routes/retell.test.ts`
- [ ] 4 tests: `call_started`, `call_ended`, `response_required`, fallback
- [ ] Suite completa pasa (~35+ tests)
- [ ] Commit

### Task 6: Actualizar docs (20 min)
- [ ] Actualizar `.env.example`
- [ ] Actualizar `docs/vault/current.md`
- [ ] Actualizar `docs/vault/tech_stack.md`
- [ ] Commit
- [ ] Git tag `f3-retell-complete`

---

## 🔌 Payload de Retell AI

**Retell → Servidor (POST /retell/llm-webhook):**
```json
{
  "interaction_type": "call_started" | "response_required" | "call_ended",
  "response_id": 1,
  "transcript": [
    { "role": "agent", "content": "¡Hola!" },
    { "role": "user", "content": "Quiero una hamburguesa" }
  ],
  "call": {
    "call_id": "call_abc123",
    "from_number": "+34600000001",
    "metadata": { "restaurantSlug": "restaurante_001" }
  }
}
```

**Servidor → Retell (respuesta):**
```json
{
  "response_id": 1,
  "content": "Perfecto, una doble. ¿Algo más?",
  "content_complete": true,
  "end_call": false
}
```

---

## ✅ Lo que NO cambia

- `src/services/llmOrchestrator.ts` — processMessage() sigue igual
- `src/services/sessionManager.ts` — CRUD de sesiones intacto
- `src/services/paymentService.ts` — Stripe intacto
- `src/routes/whatsapp.ts` — WhatsApp completamente intacto
- `src/routes/stripeWebhook.ts` — Pagos intactos
- `src/services/inputNormalizer.ts` — Función sigue igual (caller cambia)
- Todo lo de F1+F2 — Base sólida mantiene

---

## 🧪 Verificación E2E

### Local (curl)
```bash
npm run dev

curl -X POST http://localhost:3000/retell/llm-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "interaction_type": "call_started",
    "response_id": 1,
    "transcript": [],
    "call": {
      "call_id": "test_001",
      "from_number": "+34600000001",
      "metadata": { "restaurantSlug": "restaurante_001" }
    }
  }'
  
# Expected: { "response_id": 1, "content": "¡Hola!...", "content_complete": true, "end_call": false }
```

### Production (Retell Dashboard)
1. Crear agente en retell.ai → Custom LLM mode
2. LLM URL: `https://tu-dominio.com/retell/llm-webhook`
3. Hacer test call desde dashboard
4. Verificar logs del servidor: webhooks llegan
5. Verificar Supabase: sesión creada, mensajes guardados

---

## 📊 Nuevo Roadmap

| Fase | Objetivo | Estado |
|------|----------|--------|
| **F1+F2** | Infraestructura + Cerebro IA | ✅ Completo (60% MVP) |
| **F3** | Migración Retell AI | ⏳ PRÓXIMA (este plan) |
| **F4** | Catálogo dinámico + sistema de órdenes + QA | 📅 Futura |
| **F5** | TPV Integration (pendiente cliente) | 📅 Futura |

**Timeline**: F3 debería completarse en ~3 horas. F4 después.

---

## 🔑 Decisiones Clave (registradas en memory.md de vault)

1. **Retell + Custom LLM** — Retell gestiona voz/telefonía, nosotros gestamos LLM
2. **Claude 3.5 Sonnet** — mantener en lugar de cambiar a GPT-4o
3. **Webhook HTTP** — en lugar de WebSocket complejo
4. **WhatsApp/Stripe intactos** — solo cambia capa de voz

---

## 📌 Próxima Sesión: Cómo Empezar

1. Leer este archivo de memoria
2. Leer `docs/superpowers/plans/cosmic-shimmying-flame.md` (plan completo)
3. Ejecutar Task 1 → Task 6 secuencialmente
4. Verificar E2E
5. Commit + tag `f3-retell-complete`
6. Actualizar `docs/vault/current.md` con nuevo estado

---

**Última actualización**: 2026-04-05 (planificación)
**Estado**: Listo para ejecutar
