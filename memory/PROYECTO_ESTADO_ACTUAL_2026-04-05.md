---
name: Estado del Proyecto 2026-04-05 — Post Planificación F3
description: Estado completo del proyecto después de sesión de planificación de F3 (Retell AI)
type: project
---

# 📊 Estado del Proyecto — 2026-04-05

**Fecha**: Hoy, sesión actual
**Status**: F1+F2 COMPLETO (60% MVP), F3 PLANIFICADO
**Próximo paso**: Ejecutar F3 en 6 tasks

---

## 🎯 Lo que se logró hoy

### Sesión Actual (2026-04-05)
1. ✅ Leído PDF de Barbería (Retell AI + n8n webhooks)
2. ✅ Entendido que Burger-AI debe migrar a Retell AI (voz)
3. ✅ Explorado codebase actual (F1+F2 código)
4. ✅ Identificadas todas las dependencias y archivos a cambiar
5. ✅ Diseñado plan completo de F3 (6 tasks, ~3 horas)
6. ✅ Documento de memoria creado para próxima sesión

---

## 📈 Progreso General

```
BURGER-AI: 60% → 75% del MVP (post F3)
├── F1 (Infraestructura): ✅ 100% COMPLETO
├── F2 (Cerebro IA): ✅ 100% COMPLETO
└── F3 (Voz a Retell): ⏳ LISTO PARA EJECUTAR (este plan)
    └── F4 (Catálogo + QA): 📅 Después de F3
    └── F5 (TPV): 📅 Cuando se identifique cliente
```

---

## 🗂️ Archivos del Proyecto

### Código Actual (F1+F2)
```
src/
├── index.ts                      # Arranque
├── app.ts                        # Express factory (pronto: quitar express-ws)
├── config/
│   └── env.ts                    # Validación env (pronto: cambios)
├── services/
│   ├── llmOrchestrator.ts        # ✅ INTACTO
│   ├── sessionManager.ts         # ✅ INTACTO
│   ├── paymentService.ts         # ✅ INTACTO
│   ├── inputNormalizer.ts        # ✅ INTACTO (caller cambia)
│   └── outputRouter.ts           # ⚠️ CAMBIA (quitar voz, mantener WhatsApp)
├── routes/
│   ├── health.ts                 # ✅ INTACTO
│   ├── whatsapp.ts               # ✅ INTACTO
│   ├── stripeWebhook.ts          # ✅ INTACTO
│   ├── voice.ts                  # ❌ ELIMINAR (Twilio WS)
│   ├── twiml.ts                  # ❌ ELIMINAR (TwiML generator)
│   └── retell.ts                 # 🆕 CREAR (Retell webhook)
└── types/
    └── conversation.ts           # ✅ INTACTO
```

### Tests (F1+F2)
```
tests/
├── setup.ts                      # ⚠️ CAMBIAR (quitar DEEPGRAM_API_KEY)
├── unit/
│   ├── env.test.ts               # ✅ INTACTO
│   ├── auth.test.ts              # ✅ INTACTO
│   ├── inputNormalizer.test.ts   # ✅ INTACTO
│   ├── sessionManager.test.ts    # ✅ INTACTO
│   ├── llmOrchestrator.test.ts   # ✅ INTACTO
│   ├── paymentService.test.ts    # ✅ INTACTO
│   ├── outputRouter.test.ts      # ⚠️ CAMBIAR (eliminar tests de voz)
│   └── retellWebhook.test.ts     # 🆕 CREAR
└── integration/
    ├── health.test.ts            # ✅ INTACTO
    ├── whatsapp.test.ts          # ✅ INTACTO
    └── retell.test.ts            # 🆕 CREAR
```

### Dependencias NPM

**Actuales (F1+F2):**
- ✅ `@supabase/supabase-js`, `express`, `ws`, `zod`, `jsonwebtoken`
- ✅ `@deepgram/sdk` — STT Deepgram
- ✅ `twilio` — SIP y WebSocket
- ✅ `express-ws` — WebSocket handler
- ✅ `openai` — compatible con OpenRouter
- ✅ `stripe` — pagos
- ⚠️ Falta: `retell-sdk`

**Post F3:**
- ✅ `@supabase/supabase-js`, `express`, `ws`, `zod`, `jsonwebtoken`
- ❌ Quitar: `@deepgram/sdk`
- ❌ Quitar: `twilio`
- ❌ Quitar: `express-ws`
- ✅ Agregar: `retell-sdk`
- ✅ `openai`, `stripe` mantienen

---

## 🔄 Cambio Arquitectura de Voz

### ANTES (F1+F2)
```
Twilio SIP
    ↓ WebSocket Media Streams (mulaw 8kHz)
Servidor WebSocket (src/routes/voice.ts)
    ├─ Deepgram Live WebSocket (STT real-time)
    ├─ Parsear transcripts
    ├─ Input Normalizer
    ├─ LLM Orchestrator
    └─ ElevenLabs HTTP REST (TTS)
        ↓ Twilio Media event con audio base64
Cliente escucha
```

### DESPUÉS (F3)
```
Retell AI (soporta SIP, web, etc.)
    ↓ POST /retell/llm-webhook (request-response HTTP)
Servidor Express
    ├─ InputNormalizer
    ├─ LLM Orchestrator
    └─ SessionManager + PaymentService
    ↓ { response_id, content: "texto" }
Retell AI
    ↓ STT/TTS interno (gestiona síntesis)
Cliente escucha
```

**Ventaja:** Menos código, menos overhead, menos WebSockets complejos. Similar a Barbería (n8n webhook).

---

## 📋 Estado de Dependencias

### Antes (F1+F2)
```
@deepgram/sdk@^3.9.0       ← STT
twilio@^5.3.0              ← SIP + webhooks
express-ws@^5.0.2          ← WebSocket server
openai@^6.33.0             ← LLM (OpenRouter compatible)
@supabase/supabase-js       ← BD
stripe@^21.0.1             ← Pagos
```

### Después (F3)
```
retell-sdk@^4.0.0          ← ✨ NEW (Retell webhook validation, types)
openai@^6.33.0             ← LLM (OpenRouter compatible) - MANTIENE
@supabase/supabase-js       ← BD - MANTIENE
stripe@^21.0.1             ← Pagos - MANTIENE
express@^4.19.0            ← HTTP - MANTIENE
```

---

## 🎯 Variables de Entorno

### Actuales (F1+F2, .env.local)
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
PORT=3000
NODE_ENV=development

DEEPGRAM_API_KEY=...        ← Obligatorio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

ELEVENLABS_API_KEY=...      ← Opcional
ELEVENLABS_VOICE_ID=...

OPENROUTER_API_KEY=...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

STRIPE_SECRET_KEY=...
META_VERIFY_TOKEN=...
EVOLUTION_API_URL=...
EVOLUTION_INSTANCE=...
```

### Post F3
```
SUPABASE_URL=...            ← MANTIENE
SUPABASE_ANON_KEY=...       ← MANTIENE
SUPABASE_SERVICE_KEY=...    ← MANTIENE
JWT_SECRET=...              ← MANTIENE
PORT=3000                   ← MANTIENE
NODE_ENV=development        ← MANTIENE

RETELL_API_KEY=...          ← ✨ NEW (opcional)
RETELL_WEBHOOK_SECRET=...   ← ✨ NEW (opcional)

OPENROUTER_API_KEY=...      ← MANTIENE
OPENROUTER_MODEL=...        ← MANTIENE

STRIPE_SECRET_KEY=...       ← MANTIENE
META_VERIFY_TOKEN=...       ← MANTIENE
EVOLUTION_API_URL=...       ← MANTIENE
EVOLUTION_INSTANCE=...      ← MANTIENE
```

---

## 📊 Métricas de Proyecto

### Tests
```
Antes F3:  37/37 PASS (19 F1 + 18 F2)
Después:   ~40/40 PASS (19 F1 + 18 F2 + 3 Retell unit + 4 Retell integration)
```

### Líneas de código
```
Archivo              Antes    Después  Delta
─────────────────────────────────────────
src/routes/voice.ts   127    →   0    -127 (ELIMINAR)
src/routes/twiml.ts    26    →   0     -26 (ELIMINAR)
src/routes/retell.ts    0    → 140    +140 (CREAR)
src/services/outputRouter.ts  85 → 40  -45 (quitar síntesis)
src/config/env.ts     89    → 85      -4  (limpiar)
TOTAL NETO:           ~+38 líneas (menos código, más mantenible)
```

---

## ✅ Criterios de Éxito F3

- [ ] Task 1: Config limpia, deps instaladas, compilación ✅
- [ ] Task 2: OutputRouter limpio, WhatsApp mantiene, tests pasan
- [ ] Task 3: Endpoint Retell funcional, tests unitarios pasan
- [ ] Task 4: App.ts registra Retell, routes obsoletas eliminadas
- [ ] Task 5: Tests integración cubren todos los casos
- [ ] Task 6: Documentación actualizada, git tag creado
- [ ] E2E: Servidor recibe webhooks de Retell, procesa, responde JSON válido

---

## 🚀 Timeline Estimado

| Task | Estimado | Acumulado |
|------|----------|-----------|
| 1: Config + deps | 30 min | 30 min |
| 2: OutputRouter | 20 min | 50 min |
| 3: Retell endpoint | 40 min | 90 min |
| 4: App + routes | 20 min | 110 min |
| 5: Tests integración | 30 min | 140 min |
| 6: Docs | 20 min | 160 min |
| **TOTAL** | | **~3 horas** |

---

## 📌 Decisiones Finales (Confirmadas hoy)

1. **Retell + Custom LLM** ✅
   - Retell gestiona: telefonía, STT, TTS
   - Nosotros: LLM (Claude), sesiones, pagos
   - Similar a Barbería pero con Claude

2. **Claude 3.5 Sonnet** ✅
   - Mantener en lugar de cambiar a GPT-4o
   - Vía OpenRouter

3. **HTTP webhook** ✅
   - POST /retell/llm-webhook
   - En lugar de WebSocket complejo

4. **WhatsApp + Stripe intactos** ✅
   - Solo capa de voz cambia
   - F1+F2 base sólida se mantiene

---

## 📚 Documentación

### Archivos nuevos creados HOY
- ✅ `docs/superpowers/plans/cosmic-shimmying-flame.md` — Plan completo (6 tasks)
- ✅ `memory/F3_RETELL_MIGRATION_PLAN.md` — Esta sesión (resumen ejecutivo)
- ✅ `memory/PROYECTO_ESTADO_ACTUAL_2026-04-05.md` — Este archivo (estado detallado)

### Documentos relevantes (ya existen)
- `docs/vault/current.md` — Estado del proyecto (actualizar post F3)
- `docs/vault/roadmap.md` — Fases 5 (actualizar nombres/descripciones)
- `docs/vault/tech_stack.md` — Stack técnico (actualizar descripciones)
- `CLAUDE.md` — Instrucciones del proyecto (actualizar comandos si necesario)

---

## 🎯 Próxima Sesión: Checklist

- [ ] Leer este archivo (`memory/PROYECTO_ESTADO_ACTUAL_2026-04-05.md`)
- [ ] Leer resumen F3 (`memory/F3_RETELL_MIGRATION_PLAN.md`)
- [ ] Leer plan completo (`docs/superpowers/plans/cosmic-shimmying-flame.md`)
- [ ] Ejecutar Task 1 → Task 6
- [ ] Verificar tests: `npm test` → todos pasan
- [ ] Compilación: `npm run build` → 0 errores
- [ ] Commit final + git tag
- [ ] Actualizar vault (`docs/vault/current.md`)

---

## 📌 Notas Importantes

### Lo que NO tocamos
- ✅ LLM Orchestrator sigue igual
- ✅ Session Manager intacto
- ✅ Payment Service intacto
- ✅ WhatsApp route intacta
- ✅ Stripe webhook intacto

### Riesgos Identificados
1. **Retell SDK**: Asegurar que el tipo `RetellWebhookBody` sea compatible con payload real
2. **Metadata de Retell**: Verificar que call.metadata lleva `restaurantSlug`
3. **Error handling**: Si LLM falla, devolver fallback ("Ha habido un problema...")

### Plan B (si algo falla)
- Si Retell SDK tiene problemas → usar fetch HTTP + types propios
- Si metadata no está en payload → hardcodear restaurante_001 temporalmente
- Si tests de integración fallan → revisar mocks en Jest

---

**Última actualización**: 2026-04-05 23:00 (post planificación)
**Próxima acción**: Ejecutar F3 en próxima sesión (6 tasks)
**Estado**: ✅ Listo para implementar
