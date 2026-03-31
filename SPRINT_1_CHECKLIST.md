# ✅ Sprint 1 Launch Checklist — 2026-04-01

**Responsables**: DEV 1 + DEV 2 (2 personas)
**Duración**: 7 días (01-07 Abril)
**Objetivo Final**: Servidor funcional recibe inputs de WhatsApp + Twilio, persiste en BD

---

## Pre-Sprint 1: Setup (01 de abril, mañana)

### ✅ DEV 1 — Git + Project Structure (2h)

- [ ] **Crear repositorio en GitHub** `burger-ai`
  - [ ] Estructura básica creada
  - [ ] `.gitignore` configurado (incluir `.env.local`)
  - [ ] README.md básico

- [ ] **Node.js project initialized**
  ```bash
  npm init -y
  npm install express ws @supabase/supabase-js typescript ts-node
  npm install --save-dev @types/node @types/express nodemon
  ```

- [ ] **TypeScript configured**
  - [ ] `tsconfig.json` creado
  - [ ] `src/` directory structure ready

- [ ] **Folders created**
  ```
  src/
  ├── backend/
  │   ├── routes/
  │   ├── services/
  │   └── index.ts (main entry)
  ├── schemas/ (✅ order.json ya está)
  tests/
  ```

- [ ] **package.json scripts added**
  ```json
  {
    "scripts": {
      "dev": "nodemon --exec ts-node src/backend/index.ts",
      "build": "tsc",
      "test": "jest"
    }
  }
  ```

- [ ] **`.env.local` created** (copy from `.env.example`)
  - Leave credentials empty for now (next step)

---

### ✅ ARQUITECTO + DEV 1 — External Services Setup (4h)

#### Twilio (DEV 2 lo necesita el 02/04)

- [ ] **Crear cuenta Twilio**
  - [ ] Sign up: https://www.twilio.com/console
  - [ ] Verify phone number
  - [ ] Copy `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`

- [ ] **Contratar número SIP virtual**
  - [ ] En Twilio Console → Phone Numbers → Buy Numbers
  - [ ] Seleccionar número
  - [ ] Copy `TWILIO_PHONE_NUMBER` (formato: +XXXXXXXXXXXX)

- [ ] **Configurar webhook (local)**
  - [ ] Install ngrok: https://ngrok.com
  - [ ] Run: `ngrok http 3000`
  - [ ] Copy URL: `https://xxxx-xx-xxx-xxx.ngrok-free.app`
  - [ ] Set in Twilio Console → Phone Numbers → Manage → Voice & Fax
    - Voice: `https://your-ngrok-url/voice/webhook`
    - SIP Configuration: WebSocket connection

- [ ] **Guardar en `.env.local`**
  ```
  TWILIO_ACCOUNT_SID=ACxxxxxx
  TWILIO_AUTH_TOKEN=xxxx
  TWILIO_PHONE_NUMBER=+1234567890
  TWILIO_WEBHOOK_URL=https://xxxx.ngrok-free.app/voice/webhook
  ```

#### Meta WhatsApp Business API (DEV 1 lo necesita el 02/04)

- [ ] **Crear Meta for Developers account**
  - [ ] Go to https://developers.facebook.com
  - [ ] Create app → Business

- [ ] **Configurar WhatsApp Business API**
  - [ ] Add WhatsApp product
  - [ ] Request access (puede tomar 24-48h)
  - [ ] Crear número de prueba
  - [ ] Copy `META_BUSINESS_ACCOUNT_ID`, `META_ACCESS_TOKEN`

- [ ] **Webhook de prueba**
  - [ ] URL: `https://your-ngrok-url/whatsapp/webhook`
  - [ ] Verify Token: generar string aleatorio
  - [ ] Guardar en `.env.local`

- [ ] **Guardar en `.env.local`**
  ```
  META_BUSINESS_ACCOUNT_ID=xxxx
  META_ACCESS_TOKEN=xxxx
  META_VERIFY_TOKEN=random-string-here
  META_WEBHOOK_URL=https://xxxx.ngrok-free.app/whatsapp/webhook
  ```

#### Supabase (DEV 1 lo necesita el 01/04)

- [ ] **Crear proyecto Supabase**
  - [ ] Go to https://supabase.com
  - [ ] Create project
  - [ ] Wait for setup (~2 min)
  - [ ] Copy `SUPABASE_URL` y `SUPABASE_ANON_KEY`

- [ ] **Conexión local a PostgreSQL** (opcional pero recomendado)
  - [ ] Download Supabase Docker: https://supabase.com/docs/guides/local-development
  - [ ] O usar `DATABASE_URL=postgresql://localhost/burger_ai` si local PG

- [ ] **Guardar en `.env.local`**
  ```
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=xxxx
  SUPABASE_SERVICE_KEY=xxxx
  DATABASE_URL=postgresql://postgres:password@localhost:5432/burger_ai
  ```

#### Anthropic (requerido para Sprint 2, pero preparar ahora)

- [ ] **Generar API key**
  - [ ] Go to https://console.anthropic.com
  - [ ] Create API key
  - [ ] Copy key

- [ ] **Guardar en `.env.local`**
  ```
  ANTHROPIC_API_KEY=sk-ant-xxxx
  ```

#### Deepgram (requerido para DEV 2, Sprint 2)

- [ ] **Crear cuenta Deepgram**
  - [ ] https://console.deepgram.com
  - [ ] Free tier: 50k mins/month

- [ ] **Generar API key**
  - [ ] Copy y guardar

- [ ] **Guardar en `.env.local`**
  ```
  DEEPGRAM_API_KEY=xxxx
  DEEPGRAM_MODEL=nova-2
  ```

#### ElevenLabs (requerido para Sprint 2)

- [ ] **Crear cuenta ElevenLabs**
  - [ ] https://elevenlabs.io
  - [ ] Upgrade a plan Turbo si presupuesto lo permite
  - [ ] Free tier: 10k chars/mes (insuficiente)

- [ ] **Generar API key**
  - [ ] Copy

- [ ] **Guardar en `.env.local`**
  ```
  ELEVENLABS_API_KEY=xxxx
  ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
  ```

#### Stripe (requerido para Sprint 4, pero setup ahora)

- [ ] **Crear cuenta Stripe**
  - [ ] https://dashboard.stripe.com
  - [ ] Enable test mode
  - [ ] Copy test API keys

- [ ] **Guardar en `.env.local`**
  ```
  STRIPE_API_KEY=sk_test_xxxx
  STRIPE_WEBHOOK_SECRET=whsec_test_xxxx
  ```

---

## Sprint 1 Phase 1: Días 1-4 (Lunes-Jueves, 01-04 Abril)

### DEV 1 — Supabase + Node.js Foundation

**Entrada**: `.env.local` con credenciales ✅

- [ ] **Crear migrations folder**
  ```
  src/backend/db/migrations/
  ```

- [ ] **Migration: Create orders table** (basada en `src/schemas/order.json`)
  ```sql
  CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    session_id UUID NOT NULL,
    channel TEXT NOT NULL,
    client JSONB NOT NULL,
    delivery JSONB NOT NULL,
    items JSONB NOT NULL,
    summary JSONB NOT NULL,
    payment JSONB NOT NULL,
    state TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tpv_config JSONB,
    restaurant_config JSONB
  );
  ```

- [ ] **Migration: Create sessions table**
  ```sql
  CREATE TABLE sessions_activas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

- [ ] **Run migrations**
  ```bash
  npm run db:migrate
  ```

- [ ] **Express server boilerplate**
  - [ ] `src/backend/index.ts` created
  - [ ] Basic Express app with error handling
  - [ ] CORS configured
  - [ ] Routes mounted (empty for now)

- [ ] **Test basic connection**
  ```bash
  npm run dev
  # Visit http://localhost:3000
  # Should see "Server running on port 3000"
  ```

### DEV 2 — Twilio SIP + WebSocket Handler

**Entrada**: Twilio credentials ✅ + ngrok URL ✅

- [ ] **WebSocket setup**
  ```typescript
  // src/backend/routes/voice.ts
  import WebSocket from 'ws';

  const wss = new WebSocket.Server({ port: 8081 });

  wss.on('connection', (ws) => {
    console.log('Voice connection received');

    ws.on('message', (data) => {
      console.log('Audio chunk received:', data.byteLength, 'bytes');
    });

    ws.on('close', () => {
      console.log('Voice connection closed');
    });
  });
  ```

- [ ] **Twilio webhook handler** (receives SIP connection)
  ```typescript
  // src/backend/routes/twilio-voice.ts
  import express from 'express';

  router.post('/voice/webhook', (req, res) => {
    // Extract Twilio payload
    // Parse audio stream
    // Route to WebSocket handler
    res.status(200).send('OK');
  });
  ```

- [ ] **Test with actual call**
  - [ ] Dial Twilio number from real phone
  - [ ] Listen for webhook logs
  - [ ] Verify audio frames arrive in console
  - [ ] **Criterion**: Console shows "Audio chunk received: XXXX bytes"

---

## Sprint 1 Phase 2: Días 5-7 (Viernes-Domingo, 05-07 Abril)

### DEV 1 — WhatsApp Webhook Receiver

- [ ] **Meta webhook route**
  ```typescript
  // src/backend/routes/whatsapp.ts
  router.post('/whatsapp/webhook', (req, res) => {
    const message = req.body.entry[0].changes[0].value.messages[0];

    if (message.type === 'text') {
      console.log('WhatsApp text:', message.text.body);

      // Parse → Order (partial)
      const partialOrder = {
        session_id: uuid(),
        channel: 'whatsapp',
        client: { phone: message.from },
        items: [], // Will be filled by LLM later
      };

      console.log('Order object:', partialOrder);
    }

    res.status(200).send('OK');
  });
  ```

- [ ] **Test by sending WhatsApp message**
  - [ ] Use Meta test number
  - [ ] Send: "Hola, quiero una hamburguesa"
  - [ ] **Criterion**: Console shows `Order object: {...}`

- [ ] **Optional: Save to Supabase**
  ```typescript
  const { data, error } = await supabase
    .from('sessions_activas')
    .insert([partialOrder]);
  ```

### DEV 2 — Deepgram STT Integration (Prep for Sprint 2)

- [ ] **Install Deepgram SDK**
  ```bash
  npm install @deepgram/sdk
  ```

- [ ] **Basic STT handler**
  ```typescript
  // src/backend/services/speech.ts
  import { DeepgramClient } from '@deepgram/sdk';

  const dg = new DeepgramClient(process.env.DEEPGRAM_API_KEY);

  export async function transcribeAudio(audioBuffer) {
    const result = await dg.transcription.preRecorded(
      { buffer: audioBuffer },
      { model: 'nova-2' }
    );
    return result.results.channels[0].alternatives[0].transcript;
  }
  ```

- [ ] **Integrate with voice WebSocket**
  ```typescript
  ws.on('message', async (audioChunk) => {
    const transcript = await transcribeAudio(audioChunk);
    console.log('Transcript:', transcript);
  });
  ```

- [ ] **Test with audio file**
  - [ ] Record short audio (< 10 seconds)
  - [ ] Send via WebSocket
  - [ ] **Criterion**: Console shows transcribed text

---

## Sprint 1 Success Criteria (End of Week)

✅ **All must pass to proceed to Sprint 2**

- [ ] **Git repo exists** with correct structure
  - [ ] `.gitignore` includes `.env.local`
  - [ ] README.md explains how to setup

- [ ] **WhatsApp works**
  - [ ] Send message → Logs show `Order object: {...}`
  - [ ] Data persists in Supabase `sessions_activas`

- [ ] **Twilio works**
  - [ ] Call number → Logs show `Audio chunk received: XXXX bytes`
  - [ ] WebSocket connection stable for 30+ seconds

- [ ] **Deepgram works** (MVP)
  - [ ] Send audio → Returns transcript in logs
  - [ ] Latency < 500ms for 10-sec clips

- [ ] **Database works**
  - [ ] Can insert `Order` object to Supabase
  - [ ] Can query back
  - [ ] Schema matches `src/schemas/order.json`

- [ ] **Server stability**
  - [ ] `npm run dev` runs without crashes for 1 hour
  - [ ] All routes mounted and responding

---

## Daily Standup (Días 1-7)

**Format**: 15 minutos, máximo

**Preguntas**:
1. ¿Qué terminé ayer?
2. ¿Qué hago hoy?
3. ¿Bloqueadores o problemas?

**Registro**: En `docs/vault/current.md` → sección "Dailies"

---

## Blockers & Escalation

**If credentials fail**:
- Double-check format (some APIs use `Bearer`, others `sk_...`)
- Check rate limits / trial period
- Escalate to ARQUITECTO

**If WebSocket times out**:
- Check ngrok is running: `ngrok http 3000`
- Check Twilio webhook URL is set correctly in console
- Check firewall (Windows Defender may block)

**If Supabase migration fails**:
- Ensure DATABASE_URL is correct
- Check Supabase project is active
- Verify permissions on API keys

---

## Notes

- Keep `.env.local` **never committed** — add to `.gitignore`
- Test with **real devices** (real phone for Twilio, real WhatsApp)
- Monitor **latency** from day 1 (logs should show timestamps)
- **Commit daily** at end of day (meaningful commits, not "work in progress")

---

## Success = Sprint 1 Complete ✅

On 2026-04-07 at 18:00, if all criteria pass:
- ✅ Gateway recibe inputs (WhatsApp + Twilio)
- ✅ Datos persisten en BD
- ✅ STT funciona (Deepgram)
- ✅ Ready para Sprint 2: LLM + TTS + Function Calling

**Sprint 2 comienza**: 2026-04-08
