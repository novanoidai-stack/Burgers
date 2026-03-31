# MASTER PLAN — Novo Food Ecosystem
**Última actualización**: 2026-03-31
**Versión**: 1.0

---

## VISIÓN

Novo Food es una plataforma SaaS multi-tenant que automatiza la toma de pedidos, gestión de cocina y pagos para restaurantes y hamburgueserías. Su diferenciador es la unión de IA de voz de baja latencia + WhatsApp + KDS en tiempo real + analytics en un único producto configurado sin código.

**Burger-AI** es el cliente piloto (tenant 001) que valida la plataforma en producción real.

---

## MODELO DE NEGOCIO — 3 PAQUETES

| Paquete | Concepto | Precio | Target |
|---------|----------|--------|--------|
| **NOVO CONNECT** | Middleware IA ↔ TPV actual | $299/mes | "No quiero cambiar nada" |
| **NOVO PRO** | KDS/Dashboard paralelo + su TPV | $599/mes | "Más control sin riesgos" |
| **NOVO TOTAL** | Reemplazo completo del ecosistema | $1,299/mes | "Transformación total" |

**Estrategia**: Entrada por CONNECT (bajo riesgo) → escala a PRO → upsell a TOTAL.

---

## ARQUITECTURA GENERAL

```
[Voz (Twilio+Deepgram+ElevenLabs)] [WhatsApp (Meta API)] [Web (Next.js)]
                              ↓
               API Gateway — Node.js + TypeScript
               (Auth, Rate Limiting, Orquestación)
                    ↓           ↓          ↓
              LLM Engine    TPV Adapters   Session Manager
              (Claude)      (Revo/Square)  (Redis)
                    ↓
         Supabase PostgreSQL Multi-Schema
         ├── public (usuarios, tenants, billing)
         └── restaurant_XXX (orders, products, customers, sessions)
                    ↓
         [Stripe] [WhatsApp Notif.] [Datadog]
```

---

## 6 FASES DE DESARROLLO

| Fase | Nombre | Duración | Objetivo |
|------|--------|----------|---------|
| **F1** | Infraestructura Base | 2 semanas | API Gateway, DB, Auth, primer tenant |
| **F2** | Motor de IA (Voz + WhatsApp) | 2 semanas | Pedido completo voz a cocina |
| **F3** | KDS + TPV Adapters | 2 semanas | Cocina recibe pedido en tiempo real |
| **F4** | Pagos + Snapshots + Motor de Carga | 1 semana | Pago previo, token de tiempo |
| **F5** | Dashboard No-Code (Dueños) | 2 semanas | Onboarding restaurante sin dev |
| **F6** | Pilot Launch + Analytics | 1 semana | Burger-AI en producción |

**Total: ~10 semanas** (equipo de 2 personas a 3h mínimo/día)

---

## TECH STACK

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + TypeScript (Express) |
| Frontend | Next.js (App Router) |
| Base de datos | Supabase (PostgreSQL) |
| Multi-tenancy | Schema-Level (restaurant_XXX) |
| Voz | Twilio SIP + Deepgram STT + ElevenLabs TTS |
| WhatsApp | Meta WhatsApp Business API |
| LLM | Claude 3.5 Sonnet (Function Calling) |
| Pagos | Stripe (primario) + Mercado Pago (LATAM) |
| KDS | Next.js + Supabase Realtime (WebSockets) |
| TPV | Adapter Pattern (Revo/Square/Toast) |
| Monitoreo | Datadog |
| Cache/Sesiones | Redis (in-memory para demo, Redis Cloud para prod) |

---

## MODELO DE CLAUDE POR TAREA

| Tarea | Modelo | Razón |
|-------|--------|-------|
| IA de voz (tomar pedido) | `claude-sonnet-4-6` | Velocidad + precisión Function Calling |
| WhatsApp (textos simples) | `claude-haiku-4-5` | Bajo costo, suficiente para texto |
| Motor de Tiempo / carga cocina | `claude-haiku-4-5` | Cálculo determinista, no necesita razonamiento |
| Planificación / Arquitectura | `claude-opus-4-6` | Razonamiento profundo, decisiones críticas |
| Generación de código complejo | `claude-sonnet-4-6` | Balance costo/calidad |
| Debugging complejo | `claude-opus-4-6` | Root cause analysis profundo |
| SQL complejos / migraciones | `claude-sonnet-4-6` | Precisión necesaria |
| Generación de docs/tests | `claude-haiku-4-5` | Tareas repetitivas, bajo costo |

---

## RIESGOS CLAVE

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Sin cliente piloto TPV identificado | ALTO | Contactar esta semana; Plan B: KDS propio |
| Latencia voz > 1.5s | ALTO | Deepgram VAD + ElevenLabs Turbo validado en F2 |
| TPV legacy sin API | MEDIO | Adapter pattern + KDS fallback en `adapters/tpv/kds.ts` |
| Equipo 2 personas = 6h/día | MEDIO | Dailies, desbloqueos inmediatos, no sprints paralelos |
| GDPR/CCPA datos restaurante | MEDIO | Schema-Level: DROP SCHEMA = eliminación completa |

---

## DOCUMENTOS DE REFERENCIA

| Archivo | Contenido |
|---------|-----------|
| `docs/superpowers/specs/2026-03-31-novo-food-design.md` | Spec técnica completa (fuente de verdad) |
| `docs/vault/current_sprint.md` | Estado del sprint actual |
| `docs/vault/integration_logic.md` | Lógica de integración TPV + canales |
| `docs/vault/inventory_engine.md` | Motor de Tiempo + Stock Dinámico |
| `docs/vault/memory.md` | Decisiones técnicas tomadas |
| `src/schemas/order.json` | Contrato de datos universal |
