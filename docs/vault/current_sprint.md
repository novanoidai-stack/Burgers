# CURRENT SPRINT — Novo Food
**Última actualización**: 2026-03-31

---

## ESTADO ACTUAL

```
┌─────────────────────────────────────────────────────────┐
│           FASE: DISEÑO COMPLETO ✅                      │
│           PRÓXIMA: F1 — Infraestructura Base            │
│                                                         │
│  ✅ Spec técnica completa (Novo Food Design)            │
│  ✅ Schema de datos aprobado (Modelo C Híbrido)         │
│  ✅ Multi-tenancy decidido (Schema-Level)               │
│  ✅ 3 paquetes comerciales definidos                    │
│  ✅ Motor de Tiempo documentado                         │
│  ✅ Adapter Pattern TPV documentado                     │
│  ✅ src/schemas/order.json creado                       │
│  ✅ Vault completo y sincronizado                       │
│                                                         │
│  ⏳ Plan de implementación (writing-plans) — PRÓXIMO    │
│  ⏳ Git repo inicializado                               │
│  ⏳ Cuentas de servicios externos creadas               │
│  ⏳ F1: Sprint comienza 2026-04-01                      │
└─────────────────────────────────────────────────────────┘
```

---

## SPRINT ACTUAL: Pre-Sprint (Semana 0)

**Período**: 2026-03-31 → 2026-04-01
**Objetivo**: Dejar todo listo para que F1 arranque sin bloqueadores

### Checklist Pre-Sprint

#### Decisiones (HOY antes de medianoche)
- [x] Backend: **Node.js + TypeScript**
- [x] Voz: **Twilio SIP + Deepgram + ElevenLabs**
- [x] BD: **Supabase (Schema-Level)**
- [x] Modelo de datos: **Híbrido (Modelo C)**
- [x] Multi-tenancy: **Schema-Level**

#### Infraestructura (antes del 01/04)
- [ ] Crear repositorio GitHub `novo-food`
- [ ] Crear proyecto Supabase
- [ ] Contratar número Twilio SIP
- [ ] Crear app Meta for Developers (WhatsApp Business)
- [ ] Generar API key Anthropic (Claude)
- [ ] Crear cuenta Deepgram (free tier: 50k min/mes)
- [ ] Crear cuenta ElevenLabs (plan Turbo si presupuesto)
- [ ] Crear cuenta Stripe (test mode)
- [ ] Copiar `.env.example` → `.env.local` y rellenar keys

---

## PRÓXIMO SPRINT: F1 — Infraestructura Base

**Período**: 2026-04-01 → 2026-04-14 (~2 semanas)
**Equipo**: 2 personas × 3h/día mínimo = ~6h/día

### Objetivos de F1
1. API Gateway Node.js funcional
2. Multi-tenancy: schema `public` + schema `restaurant_001` (Burger-AI)
3. Auth middleware (JWT)
4. Primer `Order` insertado y consultado desde Supabase
5. Webhook WhatsApp recibiendo mensajes → log en consola
6. Servidor de audio Twilio → texto llega a Deepgram STT

### División de Trabajo

| Persona | Días 1–5 (01-05 Abril) | Días 6–10 (06-10 Abril) |
|---------|----------------------|------------------------|
| **DEV 1** | Supabase project + schema público + restaurant_001 + migraciones | WhatsApp webhook receiver → parsear msg → Order draft |
| **DEV 2** | Proyecto Node.js base + tsconfig + estructura carpetas + .env | Twilio SIP + WebSocket handler → audio raw a Deepgram STT |

### Criterios de Éxito (F1)
- [ ] `npm run dev` arranca sin errores
- [ ] `POST /webhooks/whatsapp` recibe mensaje y loguea en consola
- [ ] Llamada a número Twilio → audio llega al servidor → transcrito a texto
- [ ] `INSERT` y `SELECT` en `restaurant_001.orders` funciona
- [ ] Docker Compose levanta todo el stack local

---

## SPRINTS FUTUROS (Resumen)

| Fase | Período Est. | Entregable Principal |
|------|-------------|---------------------|
| **F2** | Semanas 3–4 | Pedido completo voz → cocina (Burger-AI interno) |
| **F3** | Semanas 5–6 | KDS Next.js + TPV Adapter (primer piloto) |
| **F4** | Semana 7 | Pago Stripe previo a cocina + Token de Tiempo |
| **F5** | Semanas 8–9 | Dashboard No-Code dueños (onboarding sin dev) |
| **F6** | Semana 10 | Launch Burger-AI en producción real |

---

## BLOQUEADORES CONOCIDOS

| Bloqueador | Impacto | Responsable | Deadline |
|-----------|---------|-------------|---------|
| Sin número Twilio | Bloquea DEV 2 en F1 | Arquitecto | 01/04 |
| Sin proyecto Supabase | Bloquea DEV 1 en F1 | Arquitecto | 01/04 |
| Sin cliente piloto TPV identificado | Bloquea F3 | Product Owner | Esta semana |

---

## NOTAS

- Actualizar este archivo después de cada milestone o cambio de sprint
- La **fuente de verdad técnica** es `docs/superpowers/specs/2026-03-31-novo-food-design.md`
- El **contrato de datos** es `src/schemas/order.json`
- Registrar decisiones técnicas nuevas en `docs/vault/memory.md`
