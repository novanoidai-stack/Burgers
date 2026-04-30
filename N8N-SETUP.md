# ⚙️ Setup N8N Cloud — Novo Burger Chatbot

**Objetivo**: Chatbot que corre 24/7 sin mantenimiento manual

**Tiempo total**: ~30 minutos (la mayoría lo hace N8N automáticamente)

---

## PASO 1: Crear Cuenta N8N Cloud (5 min)

1. Ve a **https://n8n.io**
2. Click en **Sign up** (esquina superior derecha)
3. Rellena:
   - Email: Tu email
   - Password: Segura
4. Verifica email
5. Listo, tienes workspace

---

## PASO 2: Crear Workflow desde cero (o importar)

### Opción A: Importar JSON (RECOMENDADO - 2 min)
1. En N8N, click **Import** (botón azul arriba)
2. Pega el contenido de `n8n-workflow-novo-burger.json`
3. Click **Import**
4. El workflow se carga automáticamente

### Opción B: Crear manualmente (más largo)
Si quieres aprender, puedes crear los nodos manualmente. Pero Option A es más rápido.

---

## PASO 3: Agregar Credenciales (5 min)

### 3.1 - OpenRouter API Key
1. En el workflow, busca el nodo **"LLM (Deepseek)"**
2. Click en **Credentials**
3. Click **Create new credential**
4. Pega:
   ```
   API Key: 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
   ```
5. Save

### 3.2 - Supabase
1. Busca nodo **"Supabase"**
2. Click **Credentials**
3. Click **Create new credential**
4. Pega:
   ```
   URL: https://lgujnotyqkqlwukgzkww.supabase.co
   API Key: sb_publishable_PB-1NAYR1dUuAcMHoe92QA_pRf-sjGb
   ```
5. Save

### 3.3 - WhatsApp (pendiente token)
1. Busca nodo **"WhatsApp Send"**
2. Click **Credentials**
3. Por ahora NO lo hagas (faltan tokens)
4. Lo haremos después

---

## PASO 4: Obtener Token Permanente Meta (10 min)

**IMPORTANTE**: El token que tenemos es temporal/inválido. Necesitamos uno permanente.

### Instrucciones:
1. Ve a **https://developers.facebook.com**
2. Tu app "Novo Burger"
3. Click **Settings** (esquina inferior izquierda)
4. Click **Basic**
5. Scroll hacia abajo hasta **"System Users"**
6. Click **"Add System User"** (o **"Create System User"**)
7. Rellena:
   - Name: `novo-burger-admin`
   - Role: **Administrator**
8. Click **Create**
9. En la lista de System Users, busca `novo-burger-admin`
10. Click en **"Generate New Token"**
11. Selecciona: **App**: "Novo Burger"
12. Expiration: **Never expires** (IMPORTANTE)
13. Click **Generate Token**
14. **COPIA EL TOKEN COMPLETO** (empieza con EAAS...)

---

## PASO 5: Agregar WhatsApp Credentials a N8N (5 min)

1. En N8N, busca nodo **"WhatsApp Send"**
2. Click **Credentials**
3. Click **Create new credential**
4. Pega:
   ```
   Phone Number ID: 1097727516755481
   Access Token: [el token que copiaste en PASO 4]
   ```
5. Save

---

## PASO 6: Configurar Webhook en Meta (5 min)

1. En **N8N**, abre el workflow
2. Click en nodo **"Webhook (WhatsApp)"** (el primero)
3. Verás una URL como:
   ```
   https://[tu-cuenta].n8n.cloud/webhook/whatsapp
   ```
4. Copia esa URL

5. Ve a **Meta Developer → Novo Burger → WhatsApp → Configuration**
6. En **"Webhook URL"**, pega:
   ```
   https://[tu-url-n8n]/webhooks/whatsapp
   ```
7. En **"Verify Token"**, pega:
   ```
   novo_burger_webhook_2026
   ```
8. Click **"Verify and Save"**
9. En **"Webhook Fields"**, suscríbete a: **messages**

---

## PASO 7: Activar Workflow (1 min)

1. En N8N, arriba a la derecha verás un toggle **OFF**
2. Click para activarlo (se pone **ON**)
3. El workflow está ahora **ACTIVO 24/7**

---

## PASO 8: Test (2 min)

1. Abre WhatsApp en tu teléfono
2. Escribe al número **+34 641 62 54 50**
3. Envía: `Hola, ¿a qué hora abren?`
4. **En N8N**, verás la ejecución en tiempo real
5. **En WhatsApp**, deberías recibir respuesta del bot

---

## ✅ Checklist

- [ ] Cuenta N8N Cloud creada
- [ ] Workflow importado
- [ ] OpenRouter API key agregado
- [ ] Supabase credentials agregado
- [ ] Token permanente Meta obtenido
- [ ] WhatsApp credentials agregado en N8N
- [ ] Webhook URL configurado en Meta
- [ ] Workflow activado (toggle ON)
- [ ] Test enviado → bot respondió

---

## 🔗 URLs Clave

- **N8N Dashboard**: https://app.n8n.cloud/
- **Meta Developer**: https://developers.facebook.com
- **Test WhatsApp Number**: +34 641 62 54 50

---

## ⚠️ Troubleshooting

### "Webhook verification failed en Meta"
- Verifica que la URL de N8N es correcta
- Verifica que el token es exactamente: `novo_burger_webhook_2026`

### "WhatsApp message send failed"
- Verifica que el token Meta es PERMANENTE (no temporal)
- Verifica que el Phone Number ID es: `1097727516755481`

### "No recibo respuesta del bot"
- En N8N, abre el workflow
- Click el botón ▶️ para ejecutar manualmente
- Mira si hay errores rojos
- Check logs de ejecución

---

## 📝 El Workflow Automáticamente:

1. **Recibe** mensaje de WhatsApp vía webhook
2. **Verifica** que sea un mensaje válido
3. **Llama a Deepseek** con el mensaje del cliente
4. **Guarda** la conversación en Supabase
5. **Envía** la respuesta por WhatsApp API
6. Repite infinitamente, 24/7

---

## 🚀 Una Vez Completo

- ✅ Chatbot corre en N8N Cloud
- ✅ Activo 24/7 sin terminal abierta
- ✅ Webhook URL permanente
- ✅ Clientes pueden escribir en cualquier momento
- ✅ Bot responde automáticamente
- ✅ Todo guardado en Supabase

**¡Listo para producción!**
