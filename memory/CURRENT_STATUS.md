# Estado Actual del Proyecto — Novo Burger MVP

**Última actualización**: 2026-04-28 (Sesión 5 — CAMBIO ARQUITECTÓNICO)

**Fase actual**: MIGRACIÓN → N8N Cloud (arquitectura completamente nueva)

**Status**: ✅ Abandono Express. ✅ Implementación N8N lista. **Espera: usuario crea cuenta N8N Cloud**

---

## 📋 NUEVO FLUJO ARQUITECTÓNICO (N8N Cloud)

```
WhatsApp → Meta API → N8N Cloud Webhook → OpenRouter/Deepseek → Supabase → Meta API → WhatsApp
```

**Ventajas vs Express**:
- ✅ Corre 24/7 sin terminal abierta
- ✅ Webhook URL permanente (no cambia)
- ✅ Sin mantenimiento manual
- ✅ Visual, fácil de editar
- ✅ Igual que amigos (barbershops)

---

## ✅ COMPLETADO

### BD Supabase ✅
- ✅ 22 items menú
- ✅ 10 restaurant_info
- ✅ Schema completo

### Credenciales Meta ✅
- ✅ WHATSAPP_PHONE_NUMBER_ID: 1097727516755481
- ✅ WHATSAPP_BUSINESS_ACCOUNT_ID: 1647252563277059
- ✅ App creada y verificada

### LLM ✅
- ✅ OpenRouter API key vigente
- ✅ Deepseek model lista

---

## 🔨 EN PROGRESO

### Paso 1: Crear cuenta N8N Cloud
**Estado**: Pendiente que usuario lo haga (2 minutos)
- URL: https://n8n.io
- Plan: Gratuito (5 workflows)
- Qué hace: Crear workspace

### Paso 2: Importar Workflow N8N
**Estado**: Archivo JSON listo en GitHub
- Archivo: `/n8n-workflow-novo-burger.json`
- Qué hace: Reemplaza todo lo que hacía Express

### Paso 3: Configurar Credenciales en N8N
- OpenRouter API key
- Supabase URL + key
- WhatsApp Phone ID
- **WhatsApp Access Token PERMANENTE** (pendiente)

### Paso 4: Configurar Webhook en Meta
- URL: https://[nombre-usuario].n8n.cloud/webhook/whatsapp
- Token: novo_burger_webhook_2026
- Suscribirse a: messages

### Paso 5: Activar Workflow
- Click activar en N8N
- Test desde WhatsApp

---

## 📊 Progreso

| Componente | Status | Notas |
|-----------|--------|-------|
| Supabase | ✅ 100% | BD lista |
| Meta App | ✅ 100% | App verificada |
| N8N Account | ⏳ Pendiente usuario | Crear en n8n.io |
| Workflow JSON | ✅ 100% | Listo en GitHub |
| Credenciales N8N | ⏳ En proceso | Faltan WhatsApp token |
| Webhook Meta | ⏳ Pendiente | Después de crear account |
| **TOTAL** | **60%** | |

---

## ❌ ABANDONADO (Express Stack)
- src/backend/ — Ya no se usa
- Cloudflare tunnel — Ya no necesario
- npm run dev — Ya no necesario
- .env.local (Express) — Obsoleto

---

## 🔐 Credenciales para N8N

```env
# Supabase
SUPABASE_URL=https://lgujnotyqkqlwukgzkww.supabase.co
SUPABASE_ANON_KEY=sb_publishable_PB-1NAYR1dUuAcMHoe92QA_pRf-sjGb

# OpenRouter (Deepseek)
OPENROUTER_API_KEY=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

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=1097727516755481
WHATSAPP_ACCESS_TOKEN=??? PENDIENTE (obtener token permanente)
WHATSAPP_WEBHOOK_TOKEN=novo_burger_webhook_2026
```

---

## 🎯 PRÓXIMOS PASOS EXACTOS

### YA (Usuario):
1. Ve a https://n8n.io
2. Click **Sign up** (plan gratuito)
3. Crea tu cuenta

### CUANDO confirmes (Yo):
1. Te doy instrucción exacta para importar workflow
2. Te digo dónde pegar cada credencial
3. Te digo qué URL usar en Meta

### Luego (Usuario):
1. Obtén token PERMANENTE Meta (System Users)
2. Pégalo en N8N
3. Activa workflow
4. Test

**TODO documentado en N8N-SETUP.md**

---

## 📝 Información Crítica

- **Número test**: +34 641 62 54 50
- **N8N Webhook**: https://[tu-cuenta].n8n.cloud/webhook/whatsapp
- **Workflow**: Ya listo, importar JSON
- **Express**: ABANDONADO
- **Cloudflare**: CANCELAR (ya no se usa)

---

## 🚀 Estado Final
Cuando termines los pasos:
- ✅ Chatbot corre 24/7
- ✅ Sin terminales abiertas
- ✅ Sin cloudflare
- ✅ Sin Express
- ✅ Todo en N8N Cloud
- ✅ Listo para clientes
