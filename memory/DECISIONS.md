# Decisiones Técnicas — Novo Burger

## Decisión 1: Backend → Node.js + TypeScript

- **Fecha**: 2026-03-31

- **Por qué**: Webhooks rápidos, bajo overhead, fácil integración con APIs terceros

- **Alternativas descartadas**: Python (más lento para webhooks), Go (curva de aprendizaje)

- **Estado**: BLOQUEADO ✅

## Decisión 2: Base de datos → Supabase (PostgreSQL)

- **Fecha**: 2026-03-31

- **Por qué**: PostgreSQL robusto, interfaz amigable, auth integrado, free tier generoso

- **Alternativas descartadas**: MongoDB (no relacional), Firebase (vendor lock-in)

- **Estado**: BLOQUEADO ✅

## Decisión 3: IA → Claude 3.5 Sonnet

- **Fecha**: 2026-03-31

- **Por qué**: Mejor comprensión del lenguaje natural, cost-effective, buena API

- **Modelo exacto**: claude-3-5-sonnet-20241022

- **Uso**: Procesar pedidos, validar, sugerir, responder consultas

- **Estado**: BLOQUEADO ✅

## Decisión 4: WhatsApp → Meta Business API

- **Fecha**: 2026-03-31

- **Por qué**: Canal principal de comunicación, API oficial, webhooks nativos

- **Estado**: BLOQUEADO ✅

## Decisión 5: Voz → Retell AI

- **Fecha**: 2026-04-20 (ACTUALIZADO)

- **Por qué**: Conversaciones por teléfono automáticas, más fácil de integrar que Twilio+Deepgram+ElevenLabs por separado

- **Cambio**: Antes era Twilio SIP + Deepgram + ElevenLabs (descartado por complejidad)

- **Estado**: BLOQUEADO ✅

## Decisión 6: Pagos → Stripe

- **Fecha**: 2026-03-31

- **Por qué**: Procesamiento seguro, buena documentación, test mode gratuito

- **Estado**: BLOQUEADO ✅

## Decisión 7: Frontend → React + Vite + TailwindCSS

- **Fecha**: 2026-03-31

- **Por qué**: Ecosystem grande, componentes reutilizables, Tailwind para diseño rápido

- **Nota**: NO empezar hasta Semana 4

- **Estado**: BLOQUEADO ✅

## Decisión 8: Puerto del servidor → 3001

- **Fecha**: 2026-04-20

- **Por qué**: 3000 puede conflictuar con React dev server

- **Estado**: BLOQUEADO ✅
