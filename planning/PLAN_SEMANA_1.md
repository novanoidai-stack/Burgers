# 📋 PLAN SEMANA 1 — WhatsApp MVP

**Objetivo**: Un servidor que recibe mensajes de WhatsApp, los procesa con Claude AI, y responde automáticamente.

**Timeline**: 7 días (Día 1 al Día 7\)

---

## ESTADO ACTUAL (Actualizar conforme avances)

- [ ] Estructura base del servidor Express (Día 1\)  
- [ ] Conexión a Supabase (Día 2\)  
- [ ] Webhook WhatsApp (Día 3\)  
- [ ] Integración Claude API (Día 4\)  
- [ ] Mejoras y robustez (Día 5\)  
- [ ] Testing (Día 6\)  
- [ ] Estabilización (Día 7\)

---

## DÍA 1 — Estructura Base del Servidor Express

### Objetivo

Que el servidor arranque sin errores en puerto 3001 con un endpoint /health funcionando.

### Tareas

#### Tarea 1.1 — Servidor Express mínimo

**Qué hacer**: Crear un servidor Express simple que arranque sin errores.

**Archivo a crear/modificar**: `src/server.ts`

**Contenido esperado**:

- Importar express  
- Crear app con express()  
- Montar un endpoint GET /health que responda { status: 'ok', timestamp, uptime, version }  
- Exportar función createApp() que retorna la app  
- Los imports y la estructura deben ser TypeScript strict (sin any)

#### Tarea 1.2 — Config de entorno

**Archivo a modificar**: `src/config/env.ts` (si existe) o crear nuevo

**Qué debe hacer**:

- Cargar variables de .env.local con dotenv  
- Validar que PORT y NODE\_ENV existen  
- Exportar un objeto config con { port, env, logLevel }  
- Si falta una variable crítica, lanzar error claro

#### Tarea 1.3 — Logger

**Archivo**: `src/middleware/logger.ts`

**Qué debe hacer**:

- Configurar Winston con formato JSON  
- Niveles: info, warn, error  
- No loguear credenciales  
- Exportar logger

#### Tarea 1.4 — Error handler

**Archivo**: `src/middleware/errorHandler.ts`

**Qué debe hacer**:

- Middleware de Express que capture errores globales  
- Loguea con Winston  
- Responde JSON: { error: string, status: number }

#### Tarea 1.5 — Index.ts

**Archivo**: `src/index.ts`

**Qué debe hacer**:

- Importar createApp de ./server  
- Importar logger de ./middleware/logger  
- Crear la app y hacerla escuchar en config.port  
- Loguear: "🍔 Novo Burger server running on port XXXX"

#### Tarea 1.6 — .env.local

**Archivo**: `.env.local`

**Valores mínimos para arrancar**:

NODE\_ENV=development

PORT=3001

LOG\_LEVEL=info

### Test de éxito (Día 1\)

En terminal:

npm run dev

Esperado:

🍔 Novo Burger server running on port 3001

En otra terminal:

curl http://localhost:3001/health

Esperado:

{"status":"ok","timestamp":"2026-04-20T...","uptime":5.123,"version":"1.0.0"}

### Commit

git add .

git commit \-m "feat: estructura base del servidor Express"

git push origin main

---

## DÍA 2 — Conexión a Supabase

### Objetivo

Conectar a Supabase, crear tablas, y verificar que la conexión funciona.

### Pre-requisitos

1. Cuenta en [https://supabase.com](https://supabase.com) (gratis)  
2. Proyecto creado: "novo-burger"  
3. Copiar en .env.local:  
   - SUPABASE\_URL  
   - SUPABASE\_ANON\_KEY  
   - SUPABASE\_SERVICE\_KEY

### Tareas

#### Tarea 2.1 — Crear tablas en Supabase

**Dónde**: En el dashboard de Supabase → SQL Editor

**SQL a ejecutar** (copia y pega completo):

\-- Tabla de usuarios

CREATE TABLE IF NOT EXISTS users (

  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,

  phone VARCHAR(20) UNIQUE NOT NULL,

  name VARCHAR(100),

  email VARCHAR(255),

  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

\-- Tabla de items del menú

CREATE TABLE IF NOT EXISTS menu\_items (

  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,

  name VARCHAR(100) NOT NULL,

  description TEXT,

  price DECIMAL(10,2) NOT NULL,

  category VARCHAR(50) NOT NULL,

  available BOOLEAN DEFAULT true,

  image\_url TEXT,

  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

\-- Tabla de pedidos

CREATE TABLE IF NOT EXISTS orders (

  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,

  user\_id UUID REFERENCES users(id),

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'preparing', 'ready', 'completed', 'cancelled')),

  items JSONB NOT NULL DEFAULT '\[\]',

  total DECIMAL(10,2) DEFAULT 0,

  payment\_status VARCHAR(20) DEFAULT 'pending' CHECK (payment\_status IN ('pending', 'paid', 'failed')),

  payment\_id VARCHAR(255),

  channel VARCHAR(10) NOT NULL CHECK (channel IN ('whatsapp', 'voice')),

  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

\-- Tabla de pagos

CREATE TABLE IF NOT EXISTS payments (

  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,

  order\_id UUID REFERENCES orders(id),

  stripe\_payment\_id VARCHAR(255),

  amount DECIMAL(10,2) NOT NULL,

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  method VARCHAR(50),

  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

\-- Tabla de conversaciones

CREATE TABLE IF NOT EXISTS conversations (

  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,

  user\_id UUID REFERENCES users(id),

  order\_id UUID REFERENCES orders(id),

  messages JSONB NOT NULL DEFAULT '\[\]',

  channel VARCHAR(10) NOT NULL CHECK (channel IN ('whatsapp', 'voice')),

  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

\-- Insertar algunos items de menú de ejemplo

INSERT INTO menu\_items (name, description, price, category) VALUES

  ('Clásica', 'Hamburguesa con lechuga, tomate, cebolla y salsa especial', 8.50, 'hamburguesas'),

  ('Doble Cheese', 'Doble carne con doble queso cheddar', 11.00, 'hamburguesas'),

  ('BBQ Bacon', 'Con bacon crujiente y salsa BBQ', 12.50, 'hamburguesas'),

  ('Veggie Burger', 'Hamburguesa vegetal con aguacate', 9.50, 'hamburguesas'),

  ('Patatas Fritas', 'Porción grande de patatas crujientes', 3.50, 'complementos'),

  ('Aros de Cebolla', 'Aros empanados crujientes', 4.00, 'complementos'),

  ('Nuggets (6 uds)', 'Nuggets de pollo crujientes', 5.00, 'complementos'),

  ('Coca-Cola', 'Lata 33cl', 2.00, 'bebidas'),

  ('Agua', 'Botella 50cl', 1.50, 'bebidas'),

  ('Cerveza', 'Caña de cerveza artesana', 3.00, 'bebidas'),

  ('Batido Chocolate', 'Batido cremoso de chocolate', 4.50, 'bebidas');

#### Tarea 2.2 — Servicio Supabase

**Archivo**: `src/services/supabase.ts`

**Funciones a implementar**:

- `testConnection()` — Hace SELECT count(\*) de menu\_items. Si funciona, loguea "Supabase connected ✅"  
- `findOrCreateUser(phone: string)` — Busca user por phone, si no existe lo crea  
- `getMenuItems()` — Retorna todos los items donde available \= true  
- `createOrder(userId, items, total, channel)` — Crea un pedido nuevo  
- `getOrder(orderId)` — Retorna un pedido por ID  
- `updateOrderStatus(orderId, status)` — Actualiza status  
- `saveConversation(userId, messages, channel, orderId?)` — Guarda conversación  
- `getConversation(userId)` — Retorna conversación más reciente

**Tipos necesarios**: Importar de `src/types/index.ts`

#### Tarea 2.3 — Integrar en server.ts

**Qué hacer**: Que el servidor llame a `testConnection()` al arrancar.

**Resultado**: Cuando arranques el servidor, debe loguear:

Supabase connected ✅

🍔 Novo Burger server running on port 3001

#### Tarea 2.4 — Actualizar .env.local

SUPABASE\_URL=https://TU-PROYECTO.supabase.co

SUPABASE\_ANON\_KEY=eyJhbGciOiJIUzI1NiIs...

SUPABASE\_SERVICE\_KEY=eyJhbGciOiJIUzI1NiIs...

### Test de éxito (Día 2\)

npm run dev

Esperado:

Supabase connected ✅

🍔 Novo Burger server running on port 3001

Verifica en Supabase dashboard que las tablas existen y que menu\_items tiene 11 items.

### Commit

git add .

git commit \-m "feat: conexión a Supabase con servicio CRUD completo"

git push origin main

---

## DÍA 3 — Webhook WhatsApp (Recibir Mensajes)

### Pre-requisitos

1. Cuenta en [https://developers.facebook.com](https://developers.facebook.com)  
     
2. App Meta creada para WhatsApp  
     
3. Número de teléfono de prueba  
     
4. Credenciales en .env.local:  
     
   - WHATSAPP\_PHONE\_NUMBER\_ID  
   - WHATSAPP\_BUSINESS\_ACCOUNT\_ID  
   - WHATSAPP\_ACCESS\_TOKEN  
   - WHATSAPP\_WEBHOOK\_TOKEN=novo\_burger\_webhook\_2026

   

5. ngrok instalado y corriendo:

ngrok http 3001

Esto te da una URL como [https://abc123.ngrok-free.app](https://abc123.ngrok-free.app)

### Tareas

#### Tarea 3.1 — Servicio WhatsApp

**Archivo**: `src/services/whatsapp.ts`

**Funciones**:

- `sendWhatsAppMessage(to: string, message: string)` — POST a Meta API con el mensaje  
- `parseWebhookMessage(body: any)` — Extrae el mensaje del webhook  
- `verifyWebhook(mode, token, challenge)` — Verifica que el token es válido

#### Tarea 3.2 — Ruta del webhook

**Archivo**: `src/routes/webhooks.ts`

**Endpoints**:

- `GET /webhooks/whatsapp` — Meta lo usa para VERIFICAR tu servidor  
    
  - Lee query params: hub.mode, hub.verify\_token, hub.challenge  
  - Llama a verifyWebhook()  
  - Si válido, responde 200 con challenge (como texto plano)  
  - Si no válido, responde 403


- `POST /webhooks/whatsapp` — Recibe MENSAJES  
    
  - Siempre responde 200 primero (Meta requiere respuesta rápida)  
  - Parsea el mensaje  
  - Si hay mensaje válido, loguea y responde con echo: sendWhatsAppMessage(from, "Recibido: " \+ text)

#### Tarea 3.3 — Montar en server.ts

**Qué hacer**: Añade la ruta de webhooks al servidor.

#### Tarea 3.4 — Configurar en Meta

1. Ve a [https://developers.facebook.com](https://developers.facebook.com) → Tu app → WhatsApp → Configuración  
2. En "Webhook", haz clic en "Editar"  
3. URL: `https://TU-URL-NGROK/webhooks/whatsapp`  
4. Token: `novo_burger_webhook_2026`  
5. Haz clic en "Verificar y guardar"  
6. Suscríbete al campo "messages"

#### Tarea 3.5 — Probar

1. Asegúrate de que ngrok corre  
2. Asegúrate de que npm run dev corre  
3. En Meta, envía un mensaje de prueba  
4. Deberías ver en el servidor:

📩 Mensaje recibido de 34XXXXXXXXX: Hola

5. Y recibir respuesta: "Recibido: Hola"

### Test de éxito (Día 3\)

- Webhook verificado por Meta ✅  
- Mensajes llegan al servidor ✅  
- Servidor responde con echo ✅  
- Logs muestran el mensaje ✅

### Commit

git add .

git commit \-m "feat: webhook WhatsApp funcionando — recibe y responde mensajes"

git push origin main

---

## DÍA 4 — Integración Claude API

### Pre-requisitos

1. API key de Anthropic: [https://console.anthropic.com](https://console.anthropic.com)  
2. En .env.local:

ANTHROPIC\_API\_KEY=sk-ant-tu-key-aqui

### Tareas

#### Tarea 4.1 — Servicio Claude

**Archivo**: `src/services/claude.ts`

**Función principal**: `processWithClaude(userMessage, conversationHistory, menuItems)`

**El "cerebro"**: El SYSTEM\_PROMPT que define cómo Claude actúa

Eres el asistente virtual de Novo Burger, una hamburguesería. Tu trabajo es:

1\. Saludar amablemente al cliente

2\. Mostrar el menú cuando lo pidan

3\. Tomar pedidos (preguntar cantidad, modificaciones)

4\. Confirmar el pedido completo antes de procesar

5\. Responder preguntas sobre el menú, horarios, etc.

MENÚ DISPONIBLE:

{menu} ← esto se inyecta con los items reales

REGLAS:

\- Sé amable, informal pero profesional

\- Usa emojis con moderación

\- Si el cliente pide algo que no está en el menú, díselo amablemente

\- Siempre confirma el pedido completo antes de procesar

\- Responde SIEMPRE en español

\- Si no entiendes algo, pide aclaración

\- NUNCA inventes items que no están en el menú

Responde SIEMPRE en formato JSON:

{

  "action": "greeting" | "show\_menu" | "add\_to\_order" | "confirm\_order" | "answer\_question" | "clarify",

  "order": {

    "items": \[{"product\_id": "...", "name": "...", "quantity": 1, "modifications": \[\], "subtotal": 0.00}\],

    "total": 0.00

  } | null,

  "response\_message": "Tu mensaje al cliente aquí"

}

#### Tarea 4.2 — Conectar con el webhook

**Archivo a modificar**: `src/routes/webhooks.ts`

**Flujo cuando se recibe un mensaje POST**:

1. Parsear mensaje  
2. Buscar/crear usuario  
3. Obtener conversación previa  
4. Obtener menú  
5. Llamar a processWithClaude()  
6. Si hay order, crear en Supabase  
7. Guardar conversación  
8. Enviar respuesta de Claude por WhatsApp

**IMPORTANTE**: Responder 200 a Meta INMEDIATAMENTE, luego procesar async.

#### Tarea 4.3 — Prueba

1. `npm run dev` debe funcionar  
2. Envía WhatsApp: "Hola, quiero ver el menú"  
3. Deberías recibir: El menú de hamburguesas  
4. Responde: "Quiero una Clásica y una Coca-Cola"  
5. Claude debería confirmar el pedido  
6. Verifica en Supabase que se creó el pedido

### Test de éxito (Día 4\)

- Claude API responde ✅  
- Menú se muestra correctamente ✅  
- Pedidos se crean en Supabase ✅  
- Conversaciones se guardan ✅  
- Respuestas llegan por WhatsApp ✅

### Commit

git add .

git commit \-m "feat: integración Claude API — procesamiento inteligente de pedidos"

git push origin main

---

## DÍA 5 — Mejoras y Robustez

### Tareas

#### Tarea 5.1 — Validación con Joi

**Archivo**: `src/middleware/auth.ts`

Crea middleware para:

- Validar payload del webhook de WhatsApp  
- Rate limiting: máx 30 peticiones/minuto por IP

#### Tarea 5.2 — Historial de conversaciones

**Archivo a modificar**: `src/services/supabase.ts` y `src/routes/webhooks.ts`

- Mantener historial de conversación del usuario  
- Enviar últimos 20 mensajes a Claude (para contexto)  
- Limpiar conversaciones de más de 24 horas

#### Tarea 5.3 — Tests básicos

**Archivo**: `tests/backend/services/supabase.test.ts` **Archivo**: `tests/backend/routes/webhooks.test.ts`

Crea tests para:

- Verificación de webhook (token correcto/incorrecto)  
- POST webhook retorna 200  
- Menu items se obtienen correctamente

### Commit

git add .

git commit \-m "feat: validación, rate limiting, tests básicos"

git push origin main

---

## DÍA 6-7 — Testing Final y Estabilización

### Tareas

#### Tarea 6.1 — Pruebas manuales

Conversación 1 (Pedido básico):

- "Hola" → Saludo  
- "¿Qué tienen?" → Menú  
- "Quiero una Doble Cheese" → Confirmación  
- "Y una Coca-Cola" → Añadir al pedido  
- "Eso es todo" → Resumen

Conversación 2 (Casos edge):

- "asdfjkl" → Pedir aclaración  
- "Quiero una pizza" → No existe  
- "" (vacío) → No crashear

Conversación 3 (Stress):

- Envía 10 mensajes rápido  
- Cierra/abre ngrok  
- Servidor sigue vivo

#### Tarea 6.2 — Arreglar bugs

Para cada problema encontrado:

- Documenta qué pasó  
- Arréglalo  
- Verifica que se solucionó

#### Tarea 6.3 — Actualizar memoria

**Archivo**: `memory/CURRENT_STATUS.md`

\# Estado Semana 1 — Completada ✅

\*\*Fecha\*\*: 2026-04-27

\#\# ✅ Completado

\- Servidor Express en puerto 3001 ✅

\- Supabase conectado con 6 tablas ✅

\- Webhook WhatsApp recibiendo mensajes ✅

\- Claude API procesando pedidos ✅

\- Respuestas automáticas por WhatsApp ✅

\- Pedidos guardados en BD ✅

\- Conversaciones con historial ✅

\- Tests básicos pasando ✅

\#\# 🔲 Próximo (Semana 2\)

\- Retell AI para llamadas de voz

\- Integración de voz con Claude

### Commit

git add .

git commit \-m "feat: Semana 1 completada — WhatsApp MVP funcionando"

git push origin main

---

## ✅ CHECKLIST SEMANA 1

Al final DEBE estar todo esto funcionando:

- [ ] npm run dev arranca sin errores  
- [ ] GET /health responde 200  
- [ ] Supabase conecta y loguea "Supabase connected ✅"  
- [ ] Tablas existen en Supabase con datos  
- [ ] Webhook WhatsApp verificado por Meta  
- [ ] Mensajes de WhatsApp llegan al servidor  
- [ ] Claude procesa mensajes y responde  
- [ ] Respuestas llegan por WhatsApp  
- [ ] Pedidos se guardan en Supabase  
- [ ] Conversaciones se mantienen con historial  
- [ ] Tests básicos pasan  
- [ ] Todo pusheado a GitHub  
- [ ] memory/CURRENT\_STATUS.md actualizado

---

## ERRORES COMUNES

**npm run dev no arranca**

- Verifica .env.local tiene todas las variables  
- Verifica que src/index.ts existe  
- Verifica que src/server.ts exporta createApp

**Webhook no se verifica en Meta**

- ¿ngrok sigue corriendo?  
- ¿La URL en Meta es correcta? (con /webhooks/whatsapp)  
- ¿El token es el mismo?

**Mensajes no llegan**

- ¿Estás suscrito al campo "messages" en Meta?  
- ¿El token temporal de Meta ha caducado? (caduca cada 24h)  
- ¿ngrok cambió de URL? (cada vez que se reinicia)

**Claude no responde**

- ¿ANTHROPIC\_API\_KEY es correcta?  
- ¿Revisas los logs del servidor?  
- ¿Tengo creditos en Anthropic?

---

FIN PLAN SEMANA 1  
