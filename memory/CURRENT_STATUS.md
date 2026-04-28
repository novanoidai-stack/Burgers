# Estado Actual del Proyecto — Novo Burger MVP

**Última actualización**: 2026-04-28 (Sesión 4)

**Fase actual**: PASO 4 de 4 — Test End-to-End (BLOQUEADO por token Meta)

**Status**: MVP 100% código listo. Backend corriendo. **BLOQUEADO: Token de WhatsApp inválido**

---

## ✅ COMPLETADO (Sesiones 3-4)

### PASO 1: Supabase ✅ 100% FUNCIONAL
- ✅ SQL ejecutado correctamente en Supabase
- ✅ Tabla `menu_items`: **22 items** (verificado)
- ✅ Tabla `restaurant_info`: **10 registros** (verificado)
- ✅ Base de datos LISTA

### PASO 2: Meta WhatsApp ✅ PARCIALMENTE COMPLETO
- ✅ App "Novo Burger" creada en Meta Developer
- ✅ WhatsApp product agregado
- ✅ Webhook URL configurado: `https://furnished-detail-everybody-loan.trycloudflare.com/webhooks/whatsapp`
- ✅ Webhook verificado correctamente ✅ en Meta
- ✅ Suscrito a campo "messages" ✅
- ❌ **Token de WhatsApp INVÁLIDO** — No es válido para enviar mensajes

**Credenciales obtenidas:**
```
WHATSAPP_PHONE_NUMBER_ID=1097727516755481 ✅
WHATSAPP_BUSINESS_ACCOUNT_ID=1647252563277059 ✅
WHATSAPP_ACCESS_TOKEN=??? INVÁLIDO ❌
```

### PASO 3: Cloudflare Tunnel ✅ ACTIVO
- ✅ Cloudflare tunnel corriendo en tiempo real
- ✅ URL pública: `https://furnished-detail-everybody-loan.trycloudflare.com`
- ✅ Conectado a localhost:3001
- ✅ Meta puede alcanzar el webhook

### Backend Express ✅ CORRIENDO
- ✅ `npm run dev` en puerto 3001
- ✅ Supabase conectado (22 items)
- ✅ Recibe webhooks POST de Meta correctamente
- ✅ Procesa mensajes (logs muestran: "POST /webhooks/whatsapp", "Mensaje recibido")

---

## 🔨 EN PROGRESO (BLOQUEADO)

### PASO 4: Test End-to-End ⚠️ BLOQUEADO
**Bloqueador**: Token de WhatsApp **INVÁLIDO**

Evidencia en logs:
```
OpenRouter API error: "User not found" (401)
Failed to send WhatsApp message: "Invalid OAuth access token - Cannot parse access token"
```

**El problema**: 
- Webhook se verifica ✅ en Meta
- Mensajes llegan al servidor ✅
- Pero **el token para ENVIAR mensajes es INVÁLIDO** ❌

**Soluciones intentadas (sin éxito)**:
1. Token temporal de Meta — No funciona (expira/inválido)
2. Múltiples intentos de copiar/pegar — Mismo error

**Solución necesaria**:
- Obtener **TOKEN PERMANENTE** en Meta (no temporal)
- Pasos: Meta → Settings → System Users → Crear token permanente

---

## 📊 Progreso Setup Manual

| Paso | Tarea | Status | Notas |
|------|-------|--------|-------|
| 1 | Supabase (BD + datos) | ✅ 100% | Completo |
| 2 | Meta WhatsApp (webhook) | ✅ 95% | Webhook OK, token inválido |
| 3 | Cloudflare Tunnel | ✅ 100% | Activo y funcionando |
| 4 | Test end-to-end | ❌ BLOQUEADO | Esperando token válido de Meta |
| **TOTAL** | | **75%** | |

---

## 🔐 Credenciales Actuales

### ✅ CONFIGURADO EN `.env.local`
```env
# Supabase
SUPABASE_URL=https://lgujnotyqkqlwukgzkww.supabase.co
SUPABASE_ANON_KEY=sb_publishable_PB-1NAYR1dUuAcMHoe92QA_pRf-sjGb

# OpenRouter (Deepseek)
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=deepseek/deepseek-chat

# WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID=1647252563277059
WHATSAPP_PHONE_NUMBER_ID=1097727516755481
WHATSAPP_WEBHOOK_TOKEN=novo_burger_webhook_2026
WHATSAPP_ACCESS_TOKEN=[INVÁLIDO - NECESITA REEMPLAZO]
```

---

## 🔗 URLs y Números Importantes

- **Cloudflare Tunnel**: `https://furnished-detail-everybody-loan.trycloudflare.com`
- **Webhook URL en Meta**: `https://furnished-detail-everybody-loan.trycloudflare.com/webhooks/whatsapp`
- **Número de prueba WhatsApp**: +34 641 62 54 50
- **Server local**: `http://localhost:3001`

---

## 📝 Próxima Sesión — QUÉ HACER

### Paso 1: Obtener Token Permanente de Meta
1. Ve a **Meta Developer** → Tu app "Novo Burger"
2. Click en **Settings** → **Basic**
3. Busca **"System Users"** o **"App Roles"**
4. Crea un **nuevo System User** con permisos para WhatsApp
5. Genera un **token PERMANENTE** (no temporal)
6. Copia el token completo

### Paso 2: Actualizar `.env.local`
```env
WHATSAPP_ACCESS_TOKEN=[token permanente aqui]
```

### Paso 3: Reiniciar servidor
```powershell
npm run dev
```

### Paso 4: Test
- Envía mensaje a **+34 641 62 54 50**
- Deberías recibir respuesta

---

## 🎯 Resumen para Mañana

**Pregunta**: "¿Dónde lo dejamos?"

**Respuesta automática**:
1. **Estado**: PASO 4 bloqueado — Token de Meta inválido
2. **Acción**: Obtener token PERMANENTE de Meta (no temporal)
3. **Cómo**: Settings → System Users → Token permanente
4. **Luego**: Actualizar `.env.local` y reiniciar npm
5. **Testing**: Enviar mensaje a +34 641 62 54 50

**TODO está guardado y documentado.** ✅
