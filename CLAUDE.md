# CLAUDE.md — Referencia para Claude Code

## Proyecto

- **Nombre**: Novo Burger
- **Stack**: Node.js + TypeScript + Express (puerto 3001)
- **BD**: Supabase (PostgreSQL)
- **IA**: Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- **WhatsApp**: Meta Business API
- **Voz**: Retell AI
- **Pagos**: Stripe

## Comandos

```bash
npm run dev          # Arranca servidor en modo desarrollo
npm run build        # Compila TypeScript
npm test             # Ejecuta tests con Jest
npm run lint         # Verifica código
```

## Reglas NO negociables

1. **TypeScript strict mode** — NUNCA usar `any`
2. **Try/catch en TODA función async** — Capturar errores siempre
3. **Logging con Winston** — info, warn, error (NUNCA console.log)
4. **NUNCA loguear credenciales o tokens** — Usar redact si es necesario
5. **Validar entrada con Joi** — Validación de schemas obligatoria
6. **.env.local NUNCA en Git** — Usar .env.example siempre

## Estructura

```
src/
├── server.ts           ← Express app principal
├── config.ts           ← Variables de entorno
├── services/
│   ├── claude.ts       ← Integración Claude API
│   ├── supabase.ts     ← Conexión BD
│   ├── whatsapp.ts     ← Integración Meta
│   ├── retell.ts       ← Retell AI (voz)
│   └── stripe.ts       ← Pagos
├── routes/
│   ├── webhooks.ts     ← POST /webhooks/whatsapp
│   ├── voice.ts        ← Retell AI integration
│   ├── orders.ts       ← /api/orders
│   ├── payments.ts     ← /api/payments
│   └── health.ts       ← GET /health
├── middleware/
│   ├── auth.ts         ← Validación tokens
│   ├── logger.ts       ← Logging Winston
│   └── errorHandler.ts ← Error handling global
├── types/
│   └── index.ts        ← Interfaces TypeScript
└── utils/
    └── helpers.ts      ← Funciones auxiliares
```

## Convenciones de commits

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` documentación
- `refactor:` reestructuración
- `test:` añadir tests
