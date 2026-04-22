# 📋 PLAN SEMANA 2 — Retell AI (Voz)

**Objetivo**: Los clientes pueden llamar por teléfono y hacer pedidos hablando. Retell AI convierte voz a texto, Claude procesa, y Retell responde con voz.

**Nota**: Antes de empezar esta semana, TODA la Semana 1 debe estar funcionando.

---

## ESTADO ACTUAL

- [ ] Cuenta y API key de Retell AI obtenida  
- [ ] Número de teléfono de Retell configurado  
- [ ] Servicio de Retell creado  
- [ ] Webhook de Retell integrado  
- [ ] Llamadas de prueba funcionan  
- [ ] Conversaciones por voz funcionales  
- [ ] Claude procesa llamadas correctamente

---

## PRE-REQUISITOS

1. Cuenta en [https://www.retellai.com](https://www.retellai.com) (gratis)  
2. API key en .env.local:

RETELL\_API\_KEY=tu\_key\_aqui

3. Número de teléfono de Retell (lo obtienes en el dashboard)  
4. Acceso al dashboard de Retell para verificar llamadas

---

## TAREAS

### Tarea 2.1 — Investigar API de Retell

**Qué hacer**: Leer la documentación de Retell AI.

**Resultado esperado**:

- Entender cómo funciona una llamada en Retell  
- Saber qué endpoints necesita el backend  
- Saber cómo conectar Retell con Claude

**Documento**: Crear `docs/RETELL_INTEGRATION.md` con el plan.

---

### Tarea 2.2 — Servicio de Retell

**Archivo**: `src/services/retell.ts`

**Funciones necesarias**:

- `registerVoiceAgent()` — Registra un agente de voz en Retell  
    
  - El agente debe tener el SYSTEM\_PROMPT igual al de WhatsApp  
  - Retorna agent\_id


- `handleCallEvent(event: RetellCallEvent)` — Procesa eventos de llamada  
    
  - on\_call\_started  
  - on\_call\_ended  
  - on\_transcript\_received


- `processVoiceInput(transcript: string, conversationHistory)` — Procesa la transcripción  
    
  - Llamar a Claude con el transcript  
  - Retornar la respuesta

### Tarea 2.3 — Rutas de Retell

**Archivo**: `src/routes/voice.ts` (actualizar si existe)

**Endpoints**:

- `POST /webhooks/retell/call` — Webhook de Retell para eventos de llamada  
    
  - Verifica el evento  
  - Procesa según el tipo (started, ended, transcript)  
  - Retorna 200 rápido


- `GET /api/voice/status` — Estado de una llamada específica  
    
  - Retorna información de la llamada

### Tarea 2.4 — Integración en server.ts

Añade las rutas de voice al servidor Express.

### Tarea 2.5 — Configurar en Retell

1. Ve a [https://dashboard.retellai.com](https://dashboard.retellai.com)  
2. Crea un agente nuevo  
3. Configura el webhook: `https://TU-URL-NGROK/webhooks/retell/call`  
4. Configura el SYSTEM\_PROMPT (el mismo que WhatsApp)  
5. Obtén un número de teléfono de prueba  
6. Copia la API key a .env.local

### Tarea 2.6 — Prueba de llamada

1. Llama al número de teléfono de Retell  
2. Saluda: "Hola, quiero un pedido"  
3. Sistema debería responder  
4. Pide algo: "Una Clásica"  
5. Verifica en servidor que procesó la voz  
6. Verifica en Supabase que se creó el pedido

---

## TEST DE ÉXITO (Semana 2\)

- [ ] Llamadas entrantes a Retell se reciben ✅  
- [ ] Transcripción se procesa correctamente ✅  
- [ ] Claude genera respuestas de voz ✅  
- [ ] Pedidos se crean desde llamadas ✅  
- [ ] Conversaciones de voz se guardan ✅  
- [ ] Transcritos se guardan en BD ✅

---

## COMMIT

git add .

git commit \-m "feat: integración Retell AI — pedidos por voz"

git push origin main

---

## ERRORES COMUNES

**No recibo llamadas**

- ¿El webhook en Retell está configurado correctamente?  
- ¿ngrok sigue corriendo?  
- ¿El token de Retell es válido?

**Claude no responde en llamadas**

- Verifica que el SYSTEM\_PROMPT está configurado en Retell  
- Revisa los logs del servidor  
- ¿Tengo saldo en Anthropic?

**Transcripción vacía o incorrecta**

- Habla claro y pausado  
- Acércate al teléfono  
- Revisa los logs de Retell en dashboard

---

FIN PLAN SEMANA 2  
