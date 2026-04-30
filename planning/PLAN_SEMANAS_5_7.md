# 📋 PLAN SEMANAS 5-7 — AI Improvements, Testing y Launch

**Objetivo**: Hacer el sistema más inteligente, testear exhaustivamente, y preparar para producción.

**Nota**: Semanas 1-4 deben estar completas.

---

## SEMANA 5 — AI Improvements (Agentic)

### Objetivo

Hacer que Claude sea más inteligente: recuerde clientes, sugiera platos, maneje casos complejos.

### TAREAS

#### Tarea 5.1 — Memoria de clientes

**Archivo a modificar**: `src/services/claude.ts`

Cuando se procesa un mensaje:

1. Obtener historial de pedidos previos del cliente  
2. Si el cliente ha pedido antes, sugerir: "¿Quieres lo de siempre?"  
3. Personalizar respuestas basadas en preferencias

**Función en supabase.ts**:

getPreviousOrders(userId: string, limit: 5\)

#### Tarea 5.2 — Sugerencias inteligentes

Modificar SYSTEM\_PROMPT de Claude para:

- Sugerir complementos: "¿Quieres añadir patatas fritas?"  
- Sugerir bebidas si falta  
- Sugerir ofertas/combos

#### Tarea 5.3 — Manejo de modificaciones

Entrenar Claude para entender:

- "Sin cebolla"  
- "Extra queso"  
- "Poco hecha"  
- Guardar en item.modifications

#### Tarea 5.4 — Multi-idioma

- Detectar idioma del cliente  
- Responder en ese idioma  
- Por defecto español

#### Tarea 5.5 — Correcciones conversacionales

Entender:

- "Quita la Coca-Cola"  
- "Ponme dos Clásicas en vez de una"  
- Actualizar el pedido en tiempo real

### TEST DE ÉXITO (Semana 5\)

- [ ] Claude recuerda clientes frecuentes ✅  
- [ ] Sugiere items basado en historial ✅  
- [ ] Maneja modificaciones correctamente ✅  
- [ ] Responde en idiomas diferentes ✅  
- [ ] Cancela/modifica items correctamente ✅

### COMMIT

git add .

git commit \-m "feat: AI improvements — memoria de clientes, sugerencias inteligentes"

git push origin main

---

## SEMANA 6 — Testing \+ Bug Fixes

### Objetivo

Suite de tests exhaustiva y resolver todos los bugs encontrados.

### TAREAS

#### Tarea 6.1 — Tests unitarios

**Archivo**: `tests/backend/services/claude.test.ts`

Tests para:

- Pedido simple  
- Pedido con modificaciones  
- Mensaje que no es pedido  
- Mensaje vacío  
- Mock de Anthropic API

**Archivo**: `tests/backend/services/supabase.test.ts`

Tests para:

- findOrCreateUser funciona  
- getMenuItems retorna items  
- createOrder crea orden  
- getConversation retorna historial

**Archivo**: `tests/backend/services/whatsapp.test.ts`

Tests para:

- parseWebhookMessage parsea correctamente  
- verifyWebhook verifica token  
- sendWhatsAppMessage envía mensaje

#### Tarea 6.2 — Tests de integración

**Archivo**: `tests/integration/whatsapp-flow.test.ts`

Test end-to-end:

1\. Mensaje WhatsApp entra

2\. Servidor lo procesa

3\. Claude genera respuesta

4\. Respuesta se envía por WhatsApp

5\. Pedido se guarda en Supabase

**Archivo**: `tests/integration/voice-flow.test.ts`

Test end-to-end para voz (Retell).

#### Tarea 6.3 — Tests manuales exhaustivos

Conversaciones a probar:

1. Pedido básico  
2. Pedido con modificaciones  
3. Cliente que pide algo que no existe  
4. Cliente que cancela item  
5. Cliente que cambia cantidad  
6. Varios idiomas  
7. Stress: 10 mensajes rápido  
8. ngrok desconecta y reconecta

#### Tarea 6.4 — Coverage

npm test \-- \--coverage

Objetivo: mínimo 70% de coverage.

#### Tarea 6.5 — Bugs encontrados

Para cada bug:

1. Abre un GitHub Issue describiendo el problema  
2. Arréglalo  
3. Añade un test que verifique la corrección  
4. Cierra el issue

### TEST DE ÉXITO (Semana 6\)

- [ ] Todos los tests pasan ✅  
- [ ] Coverage \> 70% ✅  
- [ ] Conversaciones manuales funcionan perfectamente ✅  
- [ ] Bajo stress (10 msgs) el servidor sigue vivo ✅  
- [ ] Todos los bugs conocidos arreglados ✅

### COMMIT

git add .

git commit \-m "feat: tests exhaustivos, 70% coverage, bugs arreglados"

git push origin main

---

## SEMANA 7 — Launch

### Objetivo

Preparar para producción y hacer el primer deploy real.

### TAREAS

#### Tarea 7.1 — Dockerfile y Deploy

**Archivo**: `Dockerfile` (crear/actualizar)

FROM node:20-alpine

WORKDIR /app

\# Copiar dependencias

COPY package\*.json ./

RUN npm ci \--only=production

\# Copiar código

COPY . .

\# Build TypeScript

RUN npm run build

\# Exponer puerto

EXPOSE 3001

\# Start

CMD \["npm", "start"\]

**Archivo**: `docker-compose.prod.yml` (crear)

version: '3.8'

services:

  app:

    build: .

    ports:

      \- "3001:3001"

    env\_file: .env.local

    restart: always

#### Tarea 7.2 — Scripts de deploy

**Actualizar package.json**:

{

  "scripts": {

    "build": "tsc",

    "start": "node dist/src/index.js",

    "start:prod": "NODE\_ENV=production npm start",

    "dev": "ts-node-dev \--respawn \--transpile-only src/index.ts"

  }

}

#### Tarea 7.3 — Documentación de deployment

**Archivo**: `docs/DEPLOYMENT.md`

Instrucciones para:

1. Deploy en Railway (recomendado, gratis 500h/mes):  
     
   - Crear cuenta  
   - Conectar GitHub  
   - Seleccionar repo  
   - Configurar variables de entorno  
   - Deploy automático

   

2. Deploy en Render (alternativa):  
     
   - Similar a Railway

   

3. Configurar webhook de Meta con nueva URL  
     
4. Configurar webhook de Stripe con nueva URL

#### Tarea 7.4 — Actualizar variables de entorno

En producción (Railway/Render):

NODE\_ENV=production

PORT=3001

LOG\_LEVEL=warn

SUPABASE\_URL=\<valores reales\>

SUPABASE\_ANON\_KEY=\<valores reales\>

SUPABASE\_SERVICE\_KEY=\<valores reales\>

ANTHROPIC\_API\_KEY=\<tu key real\>

WHATSAPP\_PHONE\_NUMBER\_ID=\<real\>

WHATSAPP\_ACCESS\_TOKEN=\<real, token permanente, no temporal\>

WHATSAPP\_WEBHOOK\_TOKEN=novo\_burger\_webhook\_2026

STRIPE\_SECRET\_KEY=sk\_live\_\<tu key en modo LIVE\>

STRIPE\_PUBLIC\_KEY=pk\_live\_\<tu key en modo LIVE\>

STRIPE\_WEBHOOK\_SECRET=\<real\>

RETELL\_API\_KEY=\<real\>

**IMPORTANTE**: Cambiar Stripe de TEST a LIVE. Esto permite recibir dinero real.

#### Tarea 7.5 — Deploy en Railway

1. Ve a [https://railway.app](https://railway.app)  
2. Conecta tu GitHub  
3. Selecciona el repo novanoidai-stack/Burgers  
4. Railway detectará el Dockerfile  
5. Configura variables de entorno (Railway tiene UI para esto)  
6. Deploy automático  
7. Railway te da URL: `https://novo-burger-production.up.railway.app`

#### Tarea 7.6 — Actualizar webhooks en producción

En Meta:

- Webhook URL: `https://novo-burger-production.up.railway.app/webhooks/whatsapp`

En Stripe:

- Webhook URL: `https://novo-burger-production.up.railway.app/webhooks/stripe`

En Retell:

- Webhook URL: `https://novo-burger-production.up.railway.app/webhooks/retell/call`

#### Tarea 7.7 — Test final en producción

1. Llama por WhatsApp al número real (no de prueba)  
2. Pide un pedido completo  
3. Paga con tarjeta real  
4. Verifica que todo funciona  
5. Llama por Retell  
6. Verifica que voz funciona

#### Tarea 7.8 — Documentación final

**Archivo**: `README.md` (actualizar)

Incluir:

- Qué es Novo Burger  
- Stack técnico  
- Cómo instalar localmente  
- Cómo hacer deploy  
- Cómo usar la API  
- Licencia

**Archivo**: `docs/ARCHITECTURE.md` (actualizar si es necesario)

---

## TEST DE ÉXITO (Semana 7 — LAUNCH)

- [ ] Docker build funciona ✅  
- [ ] Deploy en Railway sin errores ✅  
- [ ] Webhook de Meta configurable con nueva URL ✅  
- [ ] Webhook de Stripe configurable con nueva URL ✅  
- [ ] Webhook de Retell configurable con nueva URL ✅  
- [ ] Prueba real en producción funciona ✅  
- [ ] Documentación completa ✅  
- [ ] README actualizado ✅

---

## LISTA DE CHEQUEO FINAL (Semana 7\)

ANTES de considerar el proyecto "LANZADO":

- [ ] ¿El servidor en producción está up 24/7?  
- [ ] ¿Los clientes pueden pedir por WhatsApp?  
- [ ] ¿Los clientes pueden pedir por teléfono?  
- [ ] ¿Los pagos funcionan en modo LIVE?  
- [ ] ¿El admin tiene acceso al dashboard?  
- [ ] ¿El menú se puede editar desde el dashboard?  
- [ ] ¿Los pedidos aparecen en tiempo real?  
- [ ] ¿Hay un proceso para actualizar el menú?  
- [ ] ¿Hay documentación para nuevos desarrolladores?  
- [ ] ¿Hay proceso de escalabilidad si crece?

---

## COMMIT FINAL

git add .

git commit \-m "feat: Novo Burger v1.0 — LAUNCH 🚀"

git push origin main

---

## DESPUÉS DEL LAUNCH

### Monitoreo

- Logs en producción (Railway proporciona)  
- Alertas de errores  
- Uptime monitoring

### Mejoras futuras

- Analytics (cuántos pedidos/día, dinero, etc.)  
- Admin app para cambiar horarios  
- Integración con POS/TPV reales  
- Notificaciones push  
- Rating de pedidos  
- Programa de lealtad

### Escalabilidad

- Bases de datos replicas  
- Cache con Redis  
- CDN para assets  
- Load balancing si crece

---

FIN PLAN SEMANAS 5-7

**🎉 ¡Felicidades\! Completaste Novo Burger MVP en 7 semanas.**  
