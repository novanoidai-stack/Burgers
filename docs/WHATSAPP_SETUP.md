# ⚙️ Configuración WhatsApp — Novo Burger

**Día 3 — Webhook WhatsApp**

**Tiempo estimado**: 15-20 minutos

---

## Paso 1: Crear App en Meta Developer

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Inicia sesión (o crea una cuenta)
3. Haz clic en **"My Apps"** → **"Create App"**
4. Selecciona **"Business"** como tipo
5. Nombre: `Novo Burger`
6. Rellena datos básicos
7. Haz clic en **"Create App"**

---

## Paso 2: Agregar Producto WhatsApp

1. En el dashboard de tu app, ve a **"Add Product"** (lado izquierdo)
2. Busca **"WhatsApp"** 
3. Haz clic en **"Set Up"**
4. Acepta los términos

---

## Paso 3: Obtener Phone Number ID y Access Token

1. En tu app, ve a **"WhatsApp"** → **"Getting Started"**
2. Verás un **"Test Message"** con un número de teléfono temporal
   - Copia este número (será tu `WHATSAPP_PHONE_NUMBER_ID`)

3. Ve a **"WhatsApp"** → **"API Setup"**
4. Busca **"Temporary Access Token"**
   - Copia este token (será tu `WHATSAPP_ACCESS_TOKEN`)
   - Nota: Es temporal. En producción, necesitarás un token permanente vía Meta App Dashboard

---

## Paso 4: Instalar ngrok (Tunnel Local)

Para que Meta pueda contactar tu servidor local, necesitas ngrok:

### En Windows:
1. Descarga desde [ngrok.com/download](https://ngrok.com/download)
2. Extrae el archivo
3. Abre una terminal en la carpeta de ngrok
4. Ejecuta:
   ```bash
   ngrok http 3001
   ```
5. Verás algo como:
   ```
   Forwarding https://abc123xyz.ngrok-free.app -> http://localhost:3001
   ```
   - Copia la URL (será `https://abc123xyz.ngrok-free.app`)

---

## Paso 5: Configurar Webhook en Meta

1. En Meta → tu app → **WhatsApp** → **Configuration**
2. Busca **"Webhook URL"**
3. Haz clic en **"Edit"**
4. **Webhook URL**:
   ```
   https://TU-URL-NGROK/webhooks/whatsapp
   ```
   (Reemplaza `TU-URL-NGROK` con tu URL de ngrok del Paso 4)

5. **Verify Token**: 
   ```
   novo_burger_webhook_2026
   ```
   (Este es el que está en .env.local)

6. Haz clic en **"Verify and Save"**
   - Meta enviará un GET a tu servidor para verificar
   - Si es correcto, verás ✅ y el webhook se guardará

---

## Paso 6: Suscribirse a Mensajes

1. En **WhatsApp** → **Configuration** (mismo lugar)
2. Busca **"Webhook Fields"**
3. Suscríbete a:
   - ✅ `messages`
4. Haz clic en **"Subscribe"**

---

## Paso 7: Actualizar .env.local

Abre `.env.local` y actualiza:

```env
WHATSAPP_PHONE_NUMBER_ID=TU_PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN=TU_ACCESS_TOKEN
WHATSAPP_WEBHOOK_TOKEN=novo_burger_webhook_2026
```

---

## Paso 8: Test

### Terminal 1 — ngrok:
```bash
ngrok http 3001
```
Mantén esto corriendo.

### Terminal 2 — Servidor:
```bash
npm run dev
```
Deberías ver:
```
✅ Supabase connected (11 menu items)
🍔 Novo Burger server running on port 3001
```

### Terminal 3 — Meta WhatsApp Test

En Meta Developer Dashboard:
1. Ve a **WhatsApp** → **API Setup**
2. En **"Test message"**, hay un botón para enviar un mensaje de prueba
3. Envía un test: "Hola"
4. En tu servidor (Terminal 2), deberías ver:
   ```
   📩 Mensaje recibido de +34XXXXXXXXX: Hola
   ✅ WhatsApp message sent
   ```
5. El cliente debería recibir: "Recibido: Hola"

---

## ✅ Listo

Si todo funciona, has completado **Día 3** ✅

**Próximo paso (Día 4)**: Integración Claude API — procesar mensajes inteligentemente.

---

## ⚠️ Troubleshooting

### "Webhook verification failed"
- ¿Está ngrok corriendo? (`ngrok http 3001`)
- ¿La URL en Meta es correcta? (con `/webhooks/whatsapp` al final)
- ¿El token es exactamente `novo_burger_webhook_2026`?

### "ngrok cambió de URL después de reiniciar"
- ngrok genera una URL nueva cada vez que reinicia
- Necesitas actualizar la URL en Meta cada vez
- (En producción, usa un dominio real)

### "No recibo mensajes"
- ¿Está la app en estado "Development" o "Production"?
- En Development, solo puedes recibir mensajes de números de prueba (Meta te da uno)
- ¿Estás suscrito al campo "messages" en Meta?

### "Error 401 al enviar mensaje"
- ¿El ACCESS_TOKEN es correcto y no ha expirado?
- ¿El PHONE_NUMBER_ID es correcto?

---

## 📚 Documentación Oficial

- [Meta WhatsApp Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [ngrok Docs](https://ngrok.com/docs)
