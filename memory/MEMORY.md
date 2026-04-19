# 📚 Memoria del Proyecto — Burger-AI

Índice de decisiones, estado y planes. Máx 200 caracteres por línea para fácil lectura.

---

## 📋 Estado Actual del Proyecto

- [Estado Proyecto 2026-04-05](PROYECTO_ESTADO_ACTUAL_2026-04-05.md) — Sesión actual: planificación F3
- [Análisis Fases 2026-04-01](ANALISIS_FASES_2026-04-01.md) — F1+F2 100% completo, 60% MVP
- [Proyecto F2 Completo](PROYECTO_F2_COMPLETO.md) — Resumen ejecutivo F2 (P0 fixes, tests)

---

## 🏗️ Planes de Implementación

- [F3: Migración Retell AI](F3_RETELL_MIGRATION_PLAN.md) — Plan de sesión actual (6 tasks, 3h)
- [Análisis Exhaustivo F1+F2](ANALISIS_EXHAUSTIVO_F1_F2.md) — 18 archivos, 12 issues P1-P2

---

## 🎯 Decisiones Arquitectónicas (Vault)

Referencia: `docs/vault/memory.md` en el proyecto (7 decisiones + plan B)

**Resumen clave:**
1. Node.js + TypeScript (no Python)
2. Twilio SIP + Deepgram + ElevenLabs (control total, no Vapi)
3. Normalización de canales en entrada
4. Claude 3.5 Sonnet vía OpenRouter
5. Supabase PostgreSQL (ACID > NoSQL)
6. Stripe primary, Mercado Pago backup
7. Full-duplex con VAD (interrupciones de usuario)

**NUEVA (F3, 2026-04-05):**
8. Retell AI Custom LLM mode (reemplaza Twilio+Deepgram+ElevenLabs)

---

## 📊 Estado de Código

### F1 (Infraestructura) — ✅ 100%
- Servidor Express + WebSockets
- Auth JWT + multi-tenancy
- 19/19 tests PASS

### F2 (Cerebro IA) — ✅ 100%
- LLM Orchestrator (Claude via OpenRouter)
- Session Manager (Supabase)
- Input Normalizer (voice + WhatsApp)
- Output Router (ElevenLabs TTS)
- Payment Service (Stripe)
- 18/18 tests PASS
- 3 P0 fixes aplicados

### F3 (Voz a Retell AI) — ⏳ PLANIFICADO
- Plan: `docs/superpowers/plans/cosmic-shimmying-flame.md`
- 6 tasks, ~3 horas
- Elimina: Deepgram, Twilio Media Streams, ElevenLabs TTS
- Crea: Retell Custom LLM webhook

---

## 🔧 Tech Stack Actual (Post F3)

| Capa | Tecnología | Status |
|------|-----------|--------|
| Voz | Retell AI | 🆕 (F3) |
| LLM | Claude 3.5 Sonnet via OpenRouter | ✅ |
| Chat | WhatsApp Business API + Evolution | ✅ |
| BD | Supabase PostgreSQL | ✅ |
| Pagos | Stripe | ✅ |
| Backend | Node.js + TypeScript + Express | ✅ |
| TPV | Pendiente (no identificado) | ⏳ |

---

## 📁 Archivos de Sesión

- `NEXT_SESSION_PROMPT.md` — Prompt para cópiar en próxima sesión (antíguo)
- `code_analysis_findings.md` — Análisis F2 previo (antíguo)

---

**Última actualización**: 2026-04-05 (sesión actual)
