# 🍔 Novo Burger — Sistema de Pedidos Inteligente con IA

**NovanoidAI** | Sistema de pedidos autónomo para hamburgueserías con IA, WhatsApp y voz

---

## 📋 ¿Qué es Novo Burger?

Novo Burger es un **sistema de pedidos inteligente** que:

✅ Recibe pedidos por **WhatsApp** (Meta Business API)  
✅ Atiende llamadas de voz con **Retell AI** (conversación natural)  
✅ Procesa órdenes con **Claude 3.5 Sonnet** (IA)  
✅ Gestiona pagos con **Stripe**  
✅ Almacena datos en **Supabase** (PostgreSQL)  
✅ Ofrece **dashboard React** para gestión de pedidos  

**Objetivo**: Automatizar la toma de pedidos en hamburgueserías sin que clientes noten que es IA.

**Timeline**: 7 semanas hasta el lanzamiento  
**Equipo**: 1 desarrollador (tú + Claude Code)

---

## ⚡ Stack Técnico

| Componente | Tecnología |
|-----------|-----------|
| **Backend** | Node.js + TypeScript (strict) + Express |
| **Puerto** | 3001 |
| **Base de Datos** | Supabase (PostgreSQL) |
| **IA** | Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`) |
| **WhatsApp** | Meta WhatsApp Business API |
| **Voz** | Retell AI |
| **Pagos** | Stripe |
| **Frontend** | React + Vite + TailwindCSS (Semana 4+) |

---

## 🎯 Flujo Principal

```
1. Cliente envía mensaje por WhatsApp
   ↓
2. Meta webhook recibe en POST /webhooks/whatsapp (port 3001)
   ↓
3. Backend valida token y extrae datos del cliente
   ↓
4. Llama a Claude API con contexto del cliente
   ↓
5. Claude retorna acción: crear pedido, consulta, pago, etc.
   ↓
6. Backend actualiza base de datos (Supabase)
   ↓
7. Backend responde a Meta API
   ↓
8. Meta envía respuesta al cliente por WhatsApp
```

**Para llamadas de voz**: Retell AI maneja la conversación en tiempo real y webhook notifica acciones.

---

## 📅 Timeline (7 Semanas)

| Semana | Objetivo | Hitos |
|--------|----------|-------|
| **1** | WhatsApp MVP | Recibir/responder mensajes, BD schema, webhook funcionando |
| **2** | Retell AI (Voz) | Llamadas entrantes, conversación natural, transcripción |
| **3** | Integración Stripe | Pagos, webhooks de confirmación, órdenes pagadas |
| **4** | Frontend React + Dashboard | UI para gestionar pedidos, ver órdenes en tiempo real |
| **5** | IA Mejorada (Agentic) | Claude con herramientas, múltiples canales, contexto cliente |
| **6** | Testing + Bug Fixes | Tests de integración, pruebas con dispositivos reales |
| **7** | LAUNCH | Deploy a producción, monitoreo, validación |

---

## 🗂️ Estructura del Proyecto

```
src/
├── server.ts              ← Express app principal
├── config.ts              ← Variables de entorno
├── middleware/
│   ├── auth.ts           ← Validación tokens (Meta, Stripe)
│   ├── logger.ts         ← Winston logging
│   └── errorHandler.ts   ← Manejo de errores global
├── routes/
│   ├── webhooks.ts       ← POST /webhooks/whatsapp
│   ├── voice.ts          ← Retell AI integration
│   ├── orders.ts         ← /api/orders
│   ├── payments.ts       ← /api/payments
│   └── health.ts         ← GET /health
├── services/
│   ├── claude.ts         ← Integración Claude API
│   ├── supabase.ts       ← Conexión BD
│   ├── stripe.ts         ← Pagos
│   ├── whatsapp.ts       ← Meta API
│   └── retell.ts         ← Retell AI
├── types/
│   └── index.ts          ← Interfaces TypeScript
└── utils/
    └── helpers.ts        ← Funciones auxiliares
```

---

## 🗄️ Base de Datos (Supabase)

**Tablas principales**:

- `users` — Clientes (phone, name, email, preferences)
- `orders` — Pedidos (items, total, status, payment_status)
- `menu_items` — Menú (nombre, precio, descripción, categoría)
- `payments` — Transacciones (stripe_id, amount, status, webhook_timestamp)
- `conversations` — Historial (client_id, message, channel, timestamp)

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- npm o yarn
- Cuentas: Supabase, Stripe, Meta WhatsApp Business

### Instalación

```bash
# Clonar y entrar al repo
git clone <repo>
cd burger-ai
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales
# (Meta API key, Stripe API key, Supabase URL, etc.)

# Correr migraciones de BD
npm run db:migrate

# Iniciar servidor en desarrollo
npm run dev
```

Servidor escuchará en `http://localhost:3001`

---

## 📝 Comandos Principales

```bash
# Desarrollo
npm run dev              # Arranca server en hot-reload
npm run build            # Compila TypeScript
npm test                 # Tests con Jest
npm run lint             # Verifica código

# Base de datos
npm run db:migrate       # Corre migraciones Supabase
npm run db:seed          # Carga datos de prueba
npm run db:reset         # Reset BD (solo dev)

# Docker
docker-compose up        # Stack completo (API + Supabase + ngrok)
docker-compose down      # Detiene servicios
```

---

## 🔑 Reglas No Negociables

1. **TypeScript strict mode** — Nunca usar `any`
2. **Try/catch en TODA función async** — Capturar y loguear errores siempre
3. **Logging con Winston** — info, warn, error (NUNCA console.log)
4. **NUNCA loguear credenciales** — Redact si es necesario
5. **Validación con Joi** — Schemas de entrada obligatorios
6. **.env.local NUNCA en Git** — Usar .env.example siempre

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar test específico
npm test -- tests/unit/orders.test.ts

# Con coverage
npm test -- --coverage
```

**Tipos de tests**:
- **Unit**: Servicios, helpers, validación
- **Integration**: Webhooks, BD, APIs externas
- **E2E**: Flujos completos (WhatsApp → Stripe → BD)

---

## 🌐 Variables de Entorno

Crea `.env.local` (NUNCA committear) con:

```env
# Express
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxxxx
SUPABASE_SECRET=xxxxx

# Claude API
CLAUDE_API_KEY=sk-ant-xxxxx

# Stripe
STRIPE_API_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Meta WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxx
WHATSAPP_API_TOKEN=xxxxx
WEBHOOK_VERIFY_TOKEN=xxxxx

# Retell AI
RETELL_API_KEY=xxxxx

# Logging
LOG_LEVEL=info
```

---

## 🏗️ Arquitectura

```
                    [WhatsApp Client]  [Voice Call]
                            ↓                ↓
    ╔═══════════════════════════════════════════════════════════╗
    ║             META WEBHOOK / RETELL WEBHOOK                 ║
    ╚═══════════════════════════════════════════════════════════╝
                            ↓
    ╔═══════════════════════════════════════════════════════════╗
    ║    EXPRESS SERVER (Node.js + TypeScript)                  ║
    ║  Rutas: /webhooks/whatsapp, /voice, /api/orders          ║
    ╚═══════════════════════════════════════════════════════════╝
                    ↙              ↙           ↘
        [Claude API]      [Supabase]     [Stripe API]
            ↓                 ↓              ↓
      (Procesa                (Almacena      (Pagos)
       órdenes)               datos)
```

---

## 🔐 Seguridad

✅ Validación de webhooks (HMAC signature)  
✅ Tokens API rotados regularmente  
✅ Conexiones HTTPS (ngrok en dev, dominio en prod)  
✅ No loguear PII o credenciales  
✅ Rate limiting en endpoints públicos  
✅ CORS configurado  

---

## 📊 Monitoreo

En **Semana 6+** configurar:
- Datadog o New Relic para APM
- Alertas en PagerDuty para errores críticos
- Dashboard de métricas (latencia, errores, volumen)

---

## 🤝 Flujo de Desarrollo

1. **Lee CLAUDE.md** para comandos específicos
2. **Crea rama**: `git checkout -b feature/xyz`
3. **Código en TypeScript** con tipos estrictos
4. **Tests**: Mínimo 70% cobertura
5. **Commit claro**: `feat: descripción` o `fix: descripción`
6. **Push y PR** cuando esté listo

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| Webhook no recibe | Verificar ngrok está activo, token en .env.local correcto |
| BD connection error | Revisar SUPABASE_URL y SUPABASE_KEY en .env.local |
| Stripe test mode | Usar claves de test (sk_test_...), no vivas (sk_live_...) |
| Timeout en Claude | Aumentar timeout en `claude.ts`, revisar latencia de red |

---

## 📞 Contacto & Soporte

- **Equipo**: NovanoidAI
- **Desarrollador**: Samu (samulitago@gmail.com)
- **Issues**: Abrir en GitHub
- **Documentación**: CLAUDE.md, docs/ folder

---

## 📄 Licencia

Privada - NovanoidAI

---

**Última actualización**: 2026-04-20  
**Estado**: Listo para Semana 1  
**Versión**: 1.0

---

*Construido con ❤️ usando Claude Code + TypeScript*
