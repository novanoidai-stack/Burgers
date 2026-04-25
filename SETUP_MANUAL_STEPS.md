# SETUP: Manual Steps Required

El MVP está 100% listo. Estos son los pasos que **SOLO TÚ** puedes hacer manualmente para activar el sistema.

---

## ✅ PASO 1: Ejecutar SQL en Supabase (5 min)

### Qué hace:
- Crea tabla `restaurant_info` con datos del foodtruck
- Actualiza tabla `orders` con campos obligatorios (nombre, teléfono, tipo, hora)
- Inserta 22 items de menú completo

### Cómo hacerlo:

1. Ve a **Supabase Dashboard** → https://supabase.com/dashboard
2. Selecciona tu proyecto "novo-burger"
3. Abre **SQL Editor** (lado izquierdo)
4. Abre archivo: `docs/restaurant-update.sql`
5. Copia TODO el contenido
6. Pégalo en la ventana SQL de Supabase
7. Click en **"RUN"** (botón arriba)
8. Espera a que termine (verde = éxito)

### Verificación:
```sql
-- Ejecuta estos comandos para verificar:
SELECT COUNT(*) FROM restaurant_info;  -- Debe dar 10
SELECT COUNT(*) FROM menu_items;       -- Debe dar 22
```

---

## ✅ PASO 2: Configurar WhatsApp en Meta Developer (15-30 min)

### Qué hace:
- Conecta tu número de WhatsApp con el sistema
- Meta te dará credenciales para que el servidor pueda enviar mensajes

### Cómo hacerlo:

#### 2.1 - Crea o usa una App en Meta
1. Ve a **Meta Developers** → https://developers.facebook.com
2. Login con tu cuenta de Facebook
3. Ve a "My Apps" (arriba derecha)
4. Click en "Create App" O usa app existente
5. Selecciona: **Business** como tipo de app
6. Rellena el formulario (nombre: "Novo Burger" o similar)
7. Click en "Create App"

#### 2.2 - Agrega WhatsApp a la App
1. En la app, busca **"Add Product"** (botón azul)
2. Busca **"WhatsApp"**
3. Click en **"Set Up"**
4. Selecciona **"Create New Business Account"** (o usa existente si tienes)
5. Rellena detalles de tu negocio

#### 2.3 - Obtén Phone Number y Access Token
1. En WhatsApp Setup, ve a **"Getting Started"**
2. Necesitarás un **Phone Number ID** (te lo da Meta)
3. Necesitarás un **Access Token** (temporal o permanente)
4. Copia ambos en un lugar seguro

#### 2.4 - Actualiza `.env.local`
```bash
cd /c/Users/samul/OneDrive/Escritorio/NovanoidAI/Burgers

# Abre .env.local en tu editor
# Actualiza estas líneas:
WHATSAPP_PHONE_NUMBER_ID=TU_PHONE_NUMBER_ID_AQUI
WHATSAPP_ACCESS_TOKEN=TU_TOKEN_AQUI

# El webhook token ya está configurado:
WHATSAPP_WEBHOOK_TOKEN=novo_burger_webhook_2026
```

### Si tienes dudas:
Ver: `docs/WHATSAPP_SETUP.md` (instrucciones detalladas con screenshots)

---

## ✅ PASO 3: Setup Webhook con ngrok (10 min)

### Qué hace:
- Tu servidor local (puerto 3001) es accesible desde internet
- Meta puede enviar mensajes a `https://xxxx.ngrok.io/webhooks/whatsapp`

### Cómo hacerlo:

#### 3.1 - Instala ngrok
```bash
# Descarga desde: https://ngrok.com/download
# O si tienes Homebrew/Scoop:
# macOS:
brew install ngrok
# Windows (Scoop):
scoop install ngrok
```

#### 3.2 - Crea túnel
```bash
ngrok http 3001
```

**Verás algo como:**
```
Forwarding https://abc123xyz.ngrok.io -> http://localhost:3001
```

Copia la URL: `https://abc123xyz.ngrok.io`

#### 3.3 - Configura Webhook en Meta
1. Ve a Meta Developer → WhatsApp → Configuration
2. En **"Webhook URL"**, pega: `https://abc123xyz.ngrok.io/webhooks/whatsapp`
3. En **"Verify Token"**, pon: `novo_burger_webhook_2026`
4. Click en **"Verify and Save"**
5. En **"Webhook fields"**, suscríbete a: **"messages"**

### ⚠️ IMPORTANTE
- ngrok necesita estar **SIEMPRE corriendo** mientras pruebes
- Si cierras ngrok, la URL cambia
- Para producción, usa un servidor real (no ngrok)

---

## ✅ PASO 4: Test de Punta a Punta (10 min)

### Qué hacer:

#### 4.1 - Arranca el servidor
```bash
cd /c/Users/samul/OneDrive/Escritorio/NovanoidAI/Burgers
npm run dev
```

Deberías ver:
```
✅ Supabase connected (22 menu items)
🍔 Novo Burger server running on port 3001
```

#### 4.2 - Mantén ngrok corriendo en otra terminal
```bash
ngrok http 3001
```

#### 4.3 - Escribe a WhatsApp
1. Meta te dará un **número de teléfono de prueba**
2. Desde tu teléfono, abre WhatsApp
3. Escribe al número de Meta (puede ser código de prueba)
4. Envía mensajes de prueba:

**Test 1: Pregunta sobre el local**
```
¿A qué hora abren hoy?
```
Bot debería responder con el horario.

**Test 2: Pedir el menú**
```
Muéstrame el menú
```
Bot debería mostrar todos los items.

**Test 3: Hacer un pedido**
```
Quiero dos Clásicas y una Coca-Cola
```
Bot debería:
1. Acumular los items
2. Pedir tu nombre, teléfono, tipo, hora
3. Ofrecer postre
4. Confirmar y enviar a "cocina"

### 4.4 - Verifica en Supabase
- Ve a Supabase Dashboard
- Abre tabla **"conversations"**
- Deberías ver tu conversación guardada
- Abre tabla **"orders"**
- Deberías ver tu pedido creado

---

## 🎯 Test Checklist

- [ ] SQL ejecutado en Supabase (22 items en menú)
- [ ] WhatsApp configurado en Meta (Phone ID + Token)
- [ ] `.env.local` actualizado con credenciales
- [ ] ngrok corriendo con puerto 3001
- [ ] Servidor Express arrancado (`npm run dev`)
- [ ] Webhook verificado en Meta ("Verify and Save")
- [ ] Mensaje test enviado desde WhatsApp
- [ ] Bot respondió a la pregunta
- [ ] Menú mostrado correctamente
- [ ] Pedido acumulado y confirmado
- [ ] Orden guardada en Supabase
- [ ] Conversación guardada en Supabase

---

## ❌ Troubleshooting

### "Supabase connection failed"
- Verifica `.env.local` tiene las credenciales correctas
- Verifica el SQL se ejecutó bien (22 items, 10 restaurant_info)

### "Bot no responde"
- Verifica ngrok está corriendo
- Verifica webhook URL en Meta es correcta
- Verifica "messages" está suscrito
- Revisa logs del servidor (terminal `npm run dev`)

### "Error 403 en webhook"
- Verifica que el verify token es: `novo_burger_webhook_2026`
- Verifica que está en `.env.local` (debe estar ya)

### "Mensaje muy lento (>15s)"
- Timeout LLM (normal si OpenRouter está lento)
- Bot responde con: "Estoy un poco lento 😅"
- Intenta nuevamente

### "Pedido no aparece en Supabase"
- Revisa en tabla `conversations` si la conversación está
- Revisa en tabla `orders`
- Mira logs del servidor para errores

---

## 📞 Credenciales Clave

```env
# .env.local (ya configurado)
SUPABASE_URL=https://lgujnotyqkqlwukgzkww.supabase.co
SUPABASE_ANON_KEY=sb_publishable_PB-1NAYR1dUuAcMHoe92QA_pRf-sjGb
OPENROUTER_API_KEY=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
WHATSAPP_WEBHOOK_TOKEN=novo_burger_webhook_2026

# TÚ COMPLETAS (Manual):
WHATSAPP_PHONE_NUMBER_ID=??? (de Meta)
WHATSAPP_ACCESS_TOKEN=??? (de Meta)
```

---

## 🎉 Una Vez Completo

El sistema estará **100% funcional** para que lo muestres a tus clientes (dueños de foodtrucks):

✅ Cliente escribe a WhatsApp  
✅ Bot responde preguntas (horario, ubicación, menú)  
✅ Bot toma pedidos inteligentemente  
✅ Bot confirma datos del cliente  
✅ Bot sugiere productos adicionales  
✅ Pedidos se guardan en base de datos  
✅ Conversaciones se guardan para histórico  

---

## Próximos Pasos (Future)
- Semana 2: Retell AI para llamadas por teléfono
- Semana 3: Stripe para pagos reales
- Semana 4: Dashboard React para el restaurante

---

¡Avísame cuando hayas completado estos pasos! 🚀
