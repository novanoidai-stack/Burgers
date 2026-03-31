# 📊 Análisis Completo Burger-AI — Resumen Ejecutivo

**Fecha**: 2026-03-31 | **Estado**: Planificación → Lista para Sprint 1 (mañana)

---

## ✅ Lo que se completó HOY

### 1. **Análisis Arquitectónico Completo**
- Estado actual del proyecto (0 código, todo planificado)
- Identificación de gaps críticos
- Matriz de riesgos con mitigaciones
- Decisiones técnicas fundamentales

### 2. **Dos Decisiones Críticas Tomadas**

| Decisión | Elegida | Registrada en |
|----------|---------|---------------|
| Backend | **Node.js + TypeScript** | `memory.md` ✅ |
| Motor voz | **Twilio SIP + Deepgram + ElevenLabs** (no Vapi) | `memory.md` ✅ |

### 3. **Schema del Pedido Definido**
- Archivo: `src/schemas/order.json` ✅
- Formato: JSON Schema v7 (validación automática)
- Características:
  - Multi-local (múltiples restaurantes)
  - Delivery flexible (takeaway/delivery/table)
  - Estados completos (pending → completed)
  - Integración TPV + Stripe

### 4. **Infraestructura Preparada**

| Archivo | Estado | Propósito |
|---------|--------|-----------|
| `src/schemas/order.json` | ✅ Completo | Contrato de datos |
| `.env.example` | ✅ Completo | Template de variables |
| `CLAUDE.md` | ✅ Actualizado | Comandos Node.js |
| `docs/PLUGIN_SETUP.md` | ✅ Completo | Guía instalación rtk-ai |
| `docs/vault/memory.md` | ✅ Actualizado | Decisiones registradas |
| `docs/vault/current.md` | ✅ Actualizado | Estado sprint |

### 5. **Ajuste del Plan**
- Equipo: **2 personas** (no 3)
- Sprints redistribuidos en `current.md`
- Carga balanceada: DEV 1 (Supabase+WhatsApp), DEV 2 (Twilio+Deepgram)

---

## 🎯 Decisiones Finales

### Backend: Node.js + TypeScript

**Razón**: Mejor ecosistema para WebSockets de audio, SDKs de primera clase, menor latencia

```typescript
// Patrón típico Sprint 1:
import WebSocket from 'ws';
import { DeepgramClient } from '@deepgram/sdk';

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  const dg = new DeepgramClient(process.env.DEEPGRAM_API_KEY);
  const dgSocket = dg.listen.live({ model: 'nova-2' });

  ws.on('message', (audio) => dgSocket.send(audio));

  dgSocket.on('Results', (data) => {
    const transcript = data.channel.alternatives[0].transcript;
    // → Claude LLM → ElevenLabs → back to Twilio
  });
});
```

### Motor de Voz: Control Total (no Vapi)

**Flujo**:
```
Llamada Twilio SIP
  → WebSocket servidor
  → Deepgram STT (<200ms) + VAD
  → Claude function_calling
  → ElevenLabs Turbo TTS (<400ms)
  → Audio back to Twilio

Latencia total: ~1.3s ✅
Control: Total
Costo: ~$0.015/min
```

**Por qué no Vapi.ai**:
- Costo 3-5x más
- VAD no personalizable
- Latencia 1.5-2s (vs 1.3s)

---

## 📋 Order Schema — Lo Más Importante

El archivo `src/schemas/order.json` es el **contrato de datos** entre:
- IA (recibe voz/WhatsApp, genera Order)
- BD (Supabase, almacena Order)
- TPV (recibe Order)
- Pagos (Stripe, valida Order)
- Dashboard (muestra Order)

**Estructura principal**:
```json
{
  "order": {
    "id": "ORD-YYYYMMDD-XXXXX",
    "client": { "phone", "name", "email" },
    "delivery": { "type": "takeaway|delivery|table", "address", "table_number" },
    "items": [ { "product_id", "modifications", "subtotal" } ],
    "summary": { "subtotal", "tax", "delivery_fee", "total" },
    "payment": { "status", "method", "stripe_link" },
    "state": "pending|confirmed|paid|sent_to_tpv|ready|completed",
    "tpv_config": { "target": "revo|square|toast|kds_own" },
    "restaurant_config": { "restaurant_id", "allows_delivery", "delivery_zones" }
  }
}
```

**Validación**: Cualquier código puede validar contra este schema automáticamente.

---

## 🔌 Plugin rtk-ai

**Instalación**: Pendiente investigación
- Visita https://github.com/rtk-ai/homebrew-tap en navegador
- Si tiene `plugins/` → `/plugin add-marketplace <url>` en Claude
- Si tiene `.rb` files → Necesita WSL2 (documentado en `docs/PLUGIN_SETUP.md`)

---

## 📅 Próximos Pasos (Orden)

### HOY (31/03) — Completado ✅
- [x] Análisis completo → entregado
- [x] Decisiones arquitectónicas → tomadas
- [x] Schema Order → creado
- [x] Documentación → actualizada

### MAÑANA (01/04) — Sprint 1 Comienza

**Antes de empezar**:
1. DEV 1 crea repositorio Git + estructura Node.js
2. Ambos crean cuentas en servicios (Twilio, Meta, Supabase, Deepgram, ElevenLabs, Stripe)
3. Copian `.env.example` → `.env.local` y llenan credentials

**Trabajo paralelo**:
- **DEV 1** (Días 1-4): Supabase migrations desde order.json + Node.js base project
- **DEV 2** (Días 1-4): Twilio SIP + WebSocket handler recibe audio raw

**Criterios de Éxito Sprint 1**:
- ✅ WhatsApp → Order en logs
- ✅ Llamada Twilio → audio en servidor
- ✅ Deepgram → transcripción a texto
- ✅ Supabase → Order guardado y consultado

---

## ⚠️ Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|--------|-----------|
| **TPV piloto no identificado** | MEDIA | ALTO | Contactar restaurante ESTA SEMANA |
| **Latencia voz > 1.5s** | BAJA | ALTO | Validar en Sprint 2 (no Sprint 4) |
| **Fallo en credenciales services** | MEDIA | CRÍTICO | Guardar en `.env.local`, verificar cada una |
| **Git setup incompleto** | BAJA | MEDIO | Usar template `package.json` |

---

## 🎓 Lo que Debes Saber

1. **Order schema es el "corazón"** — Todo lo demás gira alrededor
2. **2 personas, 6h/día** → ~12-14h/semana productivas (Sprint 1 es intenso)
3. **Latencia es crítica** → Validar STT/LLM/TTS en cada layer
4. **TPV es desconocido** → Sin contacto con restaurante piloto, Sprint 3 es especulativo
5. **Node.js + TypeScript** → Lenguaje elegido, comandos en `CLAUDE.md`

---

## 📞 Contactos / Acción Requerida

| Acción | Responsable | Deadline |
|--------|-------------|----------|
| Crear repo GitHub | DEV 1 | Hoy antes de las 23:59 |
| Crear cuentas servicios | ARQUITECTO | Mañana 08:00 |
| Contactar cliente piloto | ARQUITECTO | ESTA SEMANA |
| Instalar plugin rtk-ai | USUARIO | Cuando entienda qué es |

---

## 📚 Referencias

- **Plan completo**: `~/.claude/plans/enchanted-painting-pearl.md`
- **Vault (fuente de verdad)**: `docs/vault/` (current.md, roadmap.md, tech_stack.md, memory.md)
- **Schema**: `src/schemas/order.json` (JSON Schema v7)
- **Variables**: `.env.example` (template de .env.local)
- **Comandos**: `CLAUDE.md` (npm run dev, npm test, etc.)
- **Plugin**: `docs/PLUGIN_SETUP.md` (guía instalación)

---

## ✨ Conclusión

Burger-AI está **100% preparado arquitectónicamente** para que 2 personas comiencen Sprint 1 mañana.

Las decisiones críticas están tomadas:
- ✅ Backend: Node.js
- ✅ Voz: Twilio + Deepgram + ElevenLabs
- ✅ Schema: Definido y listo

El riesgo principal: **Contactar al restaurante piloto para entender su TPV** (sin esto, Sprint 3 es ficticio).

**Siguiente sesión**: Inicializar Git, crear cuentas de servicios, comenzar Sprint 1.
