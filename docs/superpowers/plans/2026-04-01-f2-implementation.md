# F2 — Cerebro IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar la infraestructura de F1 con LLM (OpenRouter) + TTS (ElevenLabs) + pagos (Stripe) para que la IA tome pedidos reales por voz (Twilio) y WhatsApp, cobre con Stripe, y persista la orden en Supabase.

**Architecture:** Voz y WhatsApp convergen en un `InputNormalizer` que produce un `NormalizedInput` uniforme. El `LLMOrchestrator` procesa con OpenRouter (function calling), `OutputRouter` responde por TTS o texto, y `PaymentService` crea un Stripe Payment Link cuando el cliente confirma.

**Tech Stack:** Node.js 18+ / TypeScript, `openai` (OpenRouter-compatible), `stripe`, fetch nativo (ElevenLabs TTS HTTP), Twilio MediaStreams bidireccional, Supabase (sessions + products existentes en migration 002).

---

## File Map

### Nuevos archivos
| Archivo | Responsabilidad |
|---------|----------------|
| `src/types/conversation.ts` | NormalizedInput, SessionRow, ProductRow, ConversationStatus, LLMMessage |
| `src/services/inputNormalizer.ts` | voice transcript / WhatsApp text → NormalizedInput |
| `src/services/sessionManager.ts` | CRUD estado conversación en `restaurant_001.sessions` |
| `src/services/llmOrchestrator.ts` | OpenRouter + system prompt dinámico + function calling |
| `src/services/outputRouter.ts` | ElevenLabs TTS → Twilio WS / texto → WhatsApp (Evolution API) |
| `src/services/paymentService.ts` | Stripe Payment Link + validación webhook |
| `src/routes/stripeWebhook.ts` | POST /webhooks/stripe |
| `src/db/migrations/003_f2_sessions.sql` | ALTER sessions + seed productos El Mesón |
| `tests/unit/inputNormalizer.test.ts` | |
| `tests/unit/sessionManager.test.ts` | |
| `tests/unit/llmOrchestrator.test.ts` | |
| `tests/unit/outputRouter.test.ts` | |
| `tests/unit/paymentService.test.ts` | |

### Archivos modificados
| Archivo | Qué cambia |
|---------|-----------|
| `src/config/env.ts` | Añadir OPENROUTER_*, ELEVENLABS_VOICE_ID, TWILIO_PHONE_NUMBER, STRIPE_WEBHOOK_SECRET, EVOLUTION_API_URL, EVOLUTION_INSTANCE |
| `src/routes/voice.ts` | Integrar pipeline completo en el handler de transcript |
| `src/routes/whatsapp.ts` | Integrar pipeline completo en processWhatsAppEvent |
| `src/app.ts` | Añadir stripeWebhookRouter (raw body parser antes del JSON global) |

---

## Task 1: Instalar dependencias F2

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar paquetes**

```bash
npm install openai stripe
npm install --save-dev @types/stripe
```

> Nota: ElevenLabs se llama via fetch nativo (Node 18+), no se necesita SDK.
> `twilio` ya está instalado (v5.3.0).

- [ ] **Step 2: Verificar instalación**

```bash
node -e "require('openai'); require('stripe'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add openai and stripe dependencies for F2"
```

---

## Task 2: Migración 003 — sessions F2 + seed menú El Mesón

**Files:**
- Create: `src/db/migrations/003_f2_sessions.sql`

- [ ] **Step 1: Crear migración**

```sql
-- src/db/migrations/003_f2_sessions.sql
-- Extends sessions table with F2 state machine fields
-- Seeds El Mesón product catalog into restaurant_001.products
-- Run once in Supabase SQL editor

DO $$
DECLARE schema_name TEXT := 'restaurant_001';
BEGIN

  -- Extend sessions with conversation state machine
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT ''greeting''', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS phone_number TEXT', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT', schema_name);
  EXECUTE format('ALTER TABLE %I.sessions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES %I.orders(id)', schema_name, schema_name);

  -- Seed El Mesón menu — Smash Burgers €10
  EXECUTE format('
    INSERT INTO %I.products (name, price, category, description, is_available, allowed_modifications) VALUES
      (''Super Smash Bros'',   10.00, ''burger'', ''Pan brioche, 2x90g carne smasheada, 2x queso Cheddar, bacon caramelizado, cebolla caramelizada, pepinillos, salsa secreta'', true, ''["sin pepinillos","sin cebolla","extra queso","sin bacon"]''),
      (''Oklahoma'',           10.00, ''burger'', ''Pan brioche, 2x90g carne estilo Oklahoma, queso Cheddar, queso Gouda, salsa misteriosa, patatas paja'', true, ''["sin patatas paja","extra queso"]''),
      (''Porky Pig'',          10.00, ''burger'', ''Pan brioche, 2x90g carne, queso Cheddar, queso Gouda, mermelada de bacon, salsa casa, crema cacahuete'', true, ''["sin crema cacahuete","sin mermelada bacon"]''),
      (''Say Cheeese'',        10.00, ''burger'', ''Pan brioche, 2x90g carne, 2x queso Cheddar, 2x queso Gouda, mermelada bacon, salsa Big Mac'', true, ''["sin mermelada bacon"]''),
      (''Lacy Lotus'',         10.00, ''burger'', ''Pan brioche, 2x90g carne estilo Lacy, 2x queso Cheddar, mermelada bacon, crema Lotus'', true, ''["sin crema Lotus","sin mermelada bacon"]''),
      (''Chupacabras'',        10.00, ''burger'', ''Pan brioche, 2x90g carne, queso Cheddar, queso Gouda, queso cabra, bacon caramelizado, mermelada pimiento piquillo'', true, ''["sin queso cabra","sin piquillo","sin bacon"]''),
      (''MC Royale'',          10.00, ''burger'', ''Pan brioche, 2x90g carne, 2x queso Cheddar, lechuga, pepinillos, cebolla dulce, salsa MC Royale'', true, ''["sin lechuga","sin pepinillos","sin cebolla"]'')
    ON CONFLICT DO NOTHING
  ', schema_name);

  -- Smash Burgers premium €13
  EXECUTE format('
    INSERT INTO %I.products (name, price, category, description, is_available, allowed_modifications) VALUES
      (''The Pulled Beast'',   13.00, ''burger'', ''Pan brioche, 2x90g carne, 2x queso Cheddar, salsa especial, mermelada bacon, pulled pork, Dorito bites'', true, ''["sin Dorito bites","sin pulled pork"]''),
      (''Third Strike'',       13.00, ''burger'', ''Pan brioche, 3x90g carne, 2x queso Cheddar, queso Gouda, cebolla caramelizada, salsa Ballantines miel'', true, ''["sin cebolla","extra queso"]''),
      (''Pitrufina'',          13.00, ''burger'', ''Pan brioche, 2x90g carne, 2x queso Gouda, mermelada bacon, huevo frito, mayo trufada casera'', true, ''["sin huevo","sin mayo trufada"]''),
      (''King Korn'',          13.00, ''burger'', ''Pan brioche, 2x90g carne, queso Gouda, queso Cheddar ahumado, costilla 24h BBQ, salsa King, Kikos Mistercorn'', true, ''["sin Kikos","sin costilla"]''),
      (''Rocky'',              13.00, ''burger'', ''Pan brioche, 2x90g carne, 3x queso Cheddar, papada crujiente, salsa Raising Cane''s, salsa secreta, polvo baconeras'', true, ''["sin papada","extra queso"]''),
      (''Crazy Nuts'',         13.00, ''burger'', ''Burger del mes: pan brioche, 2x90g carne, queso Cheddar, queso Gouda, queso Cheddar ahumado, cebolla dulce, mermelada bacon, salsa Cane''s, crema cacahuete'', true, ''["sin crema cacahuete","sin cebolla"]'')
    ON CONFLICT DO NOTHING
  ', schema_name);

  -- Raciones
  EXECUTE format('
    INSERT INTO %I.products (name, price, category, description, is_available, allowed_modifications) VALUES
      (''Alitas de Pollo (10uds)'',    7.00, ''racion'', ''Alitas marinadas en mezcla de especias secretas, fritas a la perfección'', true, ''[]''),
      (''Patatas Fritas Onduladas'',   6.00, ''racion'', ''Crujientes trozos de patata típicos de la cocina española'', true, ''[]''),
      (''Calamares'',                  7.00, ''racion'', ''Jugosos calamares rebozados en capa dorada y crujiente'', true, ''[]''),
      (''Fingers de Pollo (10uds)'',   7.00, ''racion'', ''Tiras de pechuga de pollo, interior tierno y jugoso'', true, ''[]''),
      (''Rabas'',                      7.00, ''racion'', ''Tiras de calamar rebozadas y fritas hasta textura crocante'', true, ''[]''),
      (''Nuggets de Pollo (10uds)'',   7.00, ''racion'', ''Tiernos bocados de pechuga de pollo empanizados'', true, ''[]'')
    ON CONFLICT DO NOTHING
  ', schema_name);

  -- Postres
  EXECUTE format('
    INSERT INTO %I.products (name, price, category, description, is_available, allowed_modifications) VALUES
      (''Cheesecake Tradicional'',     5.00, ''postre'', ''Cremosa y suave tarta de queso tradicional (para 2)'', true, ''[]''),
      (''Coulant Valrhona'',           2.50, ''postre'', ''Coulant de chocolate relleno de chocolate Valrhona fundido con nata'', true, ''[]''),
      (''Tequeños de Nocilla (4uds)'', 5.00, ''postre'', ''Tequeños de masa rellenos de Nocilla (para 2)'', true, ''[]'')
    ON CONFLICT DO NOTHING
  ', schema_name);

  RAISE NOTICE 'Migration 003 applied to schema %', schema_name;
END $$;
```

- [ ] **Step 2: Ejecutar en Supabase**

Abre el SQL editor de Supabase (https://nxfilmjrrxbyfhzkqrmt.supabase.co) y ejecuta el contenido del archivo. Verifica que el output sea:
```
NOTICE: Migration 003 applied to schema restaurant_001
```

- [ ] **Step 3: Verificar productos**

En el SQL editor de Supabase:
```sql
SELECT name, price, category FROM restaurant_001.products ORDER BY category, price;
```

Expected: 20 filas (7 burgers €10, 6 burgers €13, 6 raciones, 3 postres, 1 burger del mes).

- [ ] **Step 4: Verificar columnas en sessions**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'restaurant_001' AND table_name = 'sessions'
ORDER BY ordinal_position;
```

Expected: columnas `status`, `phone_number`, `stripe_payment_link`, `stripe_payment_intent_id`, `order_id` presentes.

- [ ] **Step 5: Commit**

```bash
git add src/db/migrations/003_f2_sessions.sql
git commit -m "feat: migration 003 — extend sessions for F2 state machine + seed El Mesón menu"
```

---

## Task 3: Ampliar env.ts con variables F2

**Files:**
- Modify: `src/config/env.ts`

- [ ] **Step 1: Escribir test fallido**

```typescript
// tests/unit/env.test.ts — añadir al final del archivo existente
it('loads OpenRouter config', () => {
  process.env.OPENROUTER_API_KEY = 'sk-or-test';
  const cfg = loadConfig();
  expect(cfg.openrouter.apiKey).toBe('sk-or-test');
  expect(cfg.openrouter.model).toBe('anthropic/claude-3.5-sonnet');
});
```

- [ ] **Step 2: Verificar que falla**

```bash
npx jest tests/unit/env.test.ts -t "loads OpenRouter config"
```

Expected: FAIL — `cfg.openrouter is undefined`

- [ ] **Step 3: Actualizar env.ts**

Reemplaza el contenido de `src/config/env.ts`:

```typescript
import { z } from 'zod';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  DEEPGRAM_API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  // ElevenLabs
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().default('21m00Tcm4TlvDq8ikWAM'),
  // OpenRouter
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('anthropic/claude-3.5-sonnet'),
  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Meta / WhatsApp
  META_VERIFY_TOKEN: z.string().optional(),
  // Evolution API (WhatsApp self-hosted)
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_INSTANCE: z.string().optional(),
  // App
  BASE_URL: z.string().url().optional(),
});

export type Config = {
  supabase: { url: string; anonKey: string; serviceKey: string };
  jwt: { secret: string };
  port: number;
  env: 'development' | 'test' | 'production';
  deepgram: { apiKey: string };
  twilio: { accountSid?: string; authToken?: string; phoneNumber?: string };
  elevenlabs: { apiKey?: string; voiceId: string };
  openrouter: { apiKey?: string; baseUrl: string; model: string };
  stripe: { secretKey?: string; webhookSecret?: string };
  meta: { verifyToken?: string };
  evolution: { apiUrl?: string; instance?: string };
  baseUrl?: string;
};

export function loadConfig(): Config {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new ConfigError(`Invalid env vars — ${issues}`);
  }

  const e = result.data;
  return {
    supabase: { url: e.SUPABASE_URL, anonKey: e.SUPABASE_ANON_KEY, serviceKey: e.SUPABASE_SERVICE_KEY },
    jwt: { secret: e.JWT_SECRET },
    port: e.PORT,
    env: e.NODE_ENV,
    deepgram: { apiKey: e.DEEPGRAM_API_KEY },
    twilio: { accountSid: e.TWILIO_ACCOUNT_SID, authToken: e.TWILIO_AUTH_TOKEN, phoneNumber: e.TWILIO_PHONE_NUMBER },
    elevenlabs: { apiKey: e.ELEVENLABS_API_KEY, voiceId: e.ELEVENLABS_VOICE_ID },
    openrouter: { apiKey: e.OPENROUTER_API_KEY, baseUrl: e.OPENROUTER_BASE_URL, model: e.OPENROUTER_MODEL },
    stripe: { secretKey: e.STRIPE_SECRET_KEY, webhookSecret: e.STRIPE_WEBHOOK_SECRET },
    meta: { verifyToken: e.META_VERIFY_TOKEN },
    evolution: { apiUrl: e.EVOLUTION_API_URL, instance: e.EVOLUTION_INSTANCE },
    baseUrl: e.BASE_URL,
  };
}

export const config = loadConfig();
```

- [ ] **Step 4: Verificar que el test pasa**

```bash
npx jest tests/unit/env.test.ts
```

Expected: PASS

- [ ] **Step 5: Verificar tests existentes no rotos**

```bash
npx jest tests/unit
```

Expected: todos PASS

- [ ] **Step 6: Commit**

```bash
git add src/config/env.ts
git commit -m "feat: extend env config with F2 vars (OpenRouter, ElevenLabs, Stripe, Evolution)"
```

---

## Task 4: Tipos F2

**Files:**
- Create: `src/types/conversation.ts`

- [ ] **Step 1: Crear archivo de tipos**

```typescript
// src/types/conversation.ts

export type ConversationStatus =
  | 'greeting'
  | 'taking_order'
  | 'confirming'
  | 'awaiting_payment'
  | 'paid'
  | 'done'
  | 'abandoned';

export type InputChannel = 'voice' | 'whatsapp';

export interface NormalizedInput {
  tenantSlug: string;   // e.g. '001'
  sessionId: string;    // voice: call SID / whatsapp: phone number
  channel: InputChannel;
  text: string;
  phoneNumber?: string; // caller phone number
}

// Matches restaurant_001.sessions row (post migration 003)
export interface SessionRow {
  id: string;
  customer_id: string | null;
  channel: InputChannel;
  order_draft: OrderDraft;
  llm_history: LLMMessage[];
  status: ConversationStatus;
  phone_number: string | null;
  stripe_payment_link: string | null;
  stripe_payment_intent_id: string | null;
  order_id: string | null;
  created_at: string;
  last_activity: string;
}

export interface OrderDraft {
  items: DraftItem[];
  status: 'taking_order' | 'confirmed';
}

export interface DraftItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number; // in euros
  modifiers: string[];
}

// Matches restaurant_001.products row
export interface ProductRow {
  id: string;
  name: string;
  price: number; // in euros (DECIMAL from DB)
  category: string;
  description: string;
  is_available: boolean;
  allowed_modifications: string[];
}

// OpenAI-compatible message format (used by OpenRouter)
export type LLMMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface LLMResponse {
  reply: string;
  sessionUpdate: Partial<Pick<SessionRow, 'llm_history' | 'order_draft' | 'status' | 'phone_number'>>;
  triggerPayment?: boolean; // true when confirm_order was called
}
```

- [ ] **Step 2: Verificar que compila**

```bash
npx tsc --noEmit
```

Expected: 0 errores

- [ ] **Step 3: Commit**

```bash
git add src/types/conversation.ts
git commit -m "feat: add F2 conversation types (NormalizedInput, SessionRow, ProductRow, LLMMessage)"
```

---

## Task 5: InputNormalizer

**Files:**
- Create: `src/services/inputNormalizer.ts`
- Create: `tests/unit/inputNormalizer.test.ts`

- [ ] **Step 1: Escribir test fallido**

```typescript
// tests/unit/inputNormalizer.test.ts
import { normalizeVoiceInput, normalizeWhatsAppInput } from '../../src/services/inputNormalizer';

describe('InputNormalizer', () => {
  describe('normalizeVoiceInput', () => {
    it('returns NormalizedInput with voice channel', () => {
      const result = normalizeVoiceInput('001', 'CA123', 'quiero una Super Smash Bros', '+34600000001');
      expect(result).toEqual({
        tenantSlug: '001',
        sessionId: 'CA123',
        channel: 'voice',
        text: 'quiero una Super Smash Bros',
        phoneNumber: '+34600000001',
      });
    });

    it('trims whitespace from transcript', () => {
      const result = normalizeVoiceInput('001', 'CA123', '  hola  ', '+34600000001');
      expect(result.text).toBe('hola');
    });

    it('returns null for empty transcript', () => {
      const result = normalizeVoiceInput('001', 'CA123', '   ', '+34600000001');
      expect(result).toBeNull();
    });
  });

  describe('normalizeWhatsAppInput', () => {
    it('returns NormalizedInput with whatsapp channel', () => {
      const result = normalizeWhatsAppInput('001', '+34600000001', 'una chupacabras por favor');
      expect(result).toEqual({
        tenantSlug: '001',
        sessionId: '+34600000001',
        channel: 'whatsapp',
        text: 'una chupacabras por favor',
        phoneNumber: '+34600000001',
      });
    });

    it('returns null for empty message', () => {
      const result = normalizeWhatsAppInput('001', '+34600000001', '');
      expect(result).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Verificar que falla**

```bash
npx jest tests/unit/inputNormalizer.test.ts
```

Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Implementar InputNormalizer**

```typescript
// src/services/inputNormalizer.ts
import { NormalizedInput, InputChannel } from '../types/conversation';

export function normalizeVoiceInput(
  tenantSlug: string,
  callSid: string,
  transcript: string,
  phoneNumber: string,
): NormalizedInput | null {
  const text = transcript.trim();
  if (!text) return null;
  return { tenantSlug, sessionId: callSid, channel: 'voice', text, phoneNumber };
}

export function normalizeWhatsAppInput(
  tenantSlug: string,
  from: string,
  messageText: string,
): NormalizedInput | null {
  const text = messageText.trim();
  if (!text) return null;
  return { tenantSlug, sessionId: from, channel: 'whatsapp', text, phoneNumber: from };
}
```

- [ ] **Step 4: Verificar que pasa**

```bash
npx jest tests/unit/inputNormalizer.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/inputNormalizer.ts tests/unit/inputNormalizer.test.ts
git commit -m "feat: add InputNormalizer — normalizes voice/WhatsApp input to unified NormalizedInput"
```

---

## Task 6: SessionManager

**Files:**
- Create: `src/services/sessionManager.ts`
- Create: `tests/unit/sessionManager.test.ts`

- [ ] **Step 1: Escribir test fallido**

```typescript
// tests/unit/sessionManager.test.ts
import { createSession, buildEmptyOrderDraft } from '../../src/services/sessionManager';
import { SessionRow } from '../../src/types/conversation';

describe('SessionManager', () => {
  describe('buildEmptyOrderDraft', () => {
    it('returns empty draft in taking_order status', () => {
      const draft = buildEmptyOrderDraft();
      expect(draft).toEqual({ items: [], status: 'taking_order' });
    });
  });

  describe('createSession (unit — mocked Supabase)', () => {
    it('throws if tenantSlug is empty', async () => {
      await expect(createSession('', 'voice', '+34600000001')).rejects.toThrow('tenantSlug required');
    });
  });
});
```

- [ ] **Step 2: Verificar que falla**

```bash
npx jest tests/unit/sessionManager.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implementar SessionManager**

```typescript
// src/services/sessionManager.ts
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { SessionRow, OrderDraft, InputChannel, ConversationStatus } from '../types/conversation';

function getTenantClient(tenantSlug: string) {
  const client = createClient(config.supabase.url, config.supabase.serviceKey);
  return client.schema(`restaurant_${tenantSlug}`) as ReturnType<typeof client.schema>;
}

export function buildEmptyOrderDraft(): OrderDraft {
  return { items: [], status: 'taking_order' };
}

export async function createSession(
  tenantSlug: string,
  channel: InputChannel,
  phoneNumber: string,
): Promise<SessionRow> {
  if (!tenantSlug) throw new Error('tenantSlug required');

  const db = getTenantClient(tenantSlug);
  const { data, error } = await db
    .from('sessions')
    .insert({
      channel,
      phone_number: phoneNumber,
      order_draft: buildEmptyOrderDraft(),
      llm_history: [],
      status: 'greeting',
      last_activity: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`createSession failed: ${error.message}`);
  return data as SessionRow;
}

export async function getSessionById(
  tenantSlug: string,
  sessionId: string,
): Promise<SessionRow | null> {
  const db = getTenantClient(tenantSlug);
  const { data } = await db
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  return (data as SessionRow) ?? null;
}

// For WhatsApp: sessionId is the phone number. Find or create.
export async function getOrCreateSessionByPhone(
  tenantSlug: string,
  phoneNumber: string,
  channel: InputChannel,
): Promise<SessionRow> {
  const db = getTenantClient(tenantSlug);

  // Find active session (not paid/done/abandoned) for this phone
  const { data } = await db
    .from('sessions')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('channel', channel)
    .not('status', 'in', '("paid","done","abandoned")')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data) return data as SessionRow;
  return createSession(tenantSlug, channel, phoneNumber);
}

export async function updateSession(
  tenantSlug: string,
  sessionId: string,
  fields: Partial<Pick<SessionRow, 'llm_history' | 'order_draft' | 'status' | 'phone_number' | 'stripe_payment_link' | 'stripe_payment_intent_id' | 'order_id'>>,
): Promise<void> {
  const db = getTenantClient(tenantSlug);
  const { error } = await db
    .from('sessions')
    .update({ ...fields, last_activity: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw new Error(`updateSession failed: ${error.message}`);
}
```

- [ ] **Step 4: Verificar que pasa**

```bash
npx jest tests/unit/sessionManager.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/sessionManager.ts tests/unit/sessionManager.test.ts
git commit -m "feat: add SessionManager — CRUD conversation state in restaurant_001.sessions"
```

---

## Task 7: LLMOrchestrator

**Files:**
- Create: `src/services/llmOrchestrator.ts`
- Create: `tests/unit/llmOrchestrator.test.ts`

- [ ] **Step 1: Escribir test fallido**

```typescript
// tests/unit/llmOrchestrator.test.ts
import { buildSystemPrompt, applyToolCall } from '../../src/services/llmOrchestrator';
import { ProductRow, SessionRow } from '../../src/types/conversation';
import { buildEmptyOrderDraft } from '../../src/services/sessionManager';

const mockProducts: ProductRow[] = [
  { id: 'p1', name: 'Super Smash Bros', price: 10, category: 'burger', description: 'Deliciosa', is_available: true, allowed_modifications: ['sin pepinillos'] },
  { id: 'p2', name: 'Patatas Fritas', price: 6, category: 'racion', description: 'Crujientes', is_available: true, allowed_modifications: [] },
];

describe('LLMOrchestrator', () => {
  describe('buildSystemPrompt', () => {
    it('includes restaurant name and menu items', () => {
      const prompt = buildSystemPrompt('El Mesón', mockProducts);
      expect(prompt).toContain('El Mesón');
      expect(prompt).toContain('Super Smash Bros');
      expect(prompt).toContain('10.00€');
      expect(prompt).toContain('Patatas Fritas');
    });

    it('includes guardrail rules', () => {
      const prompt = buildSystemPrompt('El Mesón', mockProducts);
      expect(prompt).toContain('Solo puedes ofrecer productos del menú');
    });
  });

  describe('applyToolCall', () => {
    let session: SessionRow;

    beforeEach(() => {
      session = {
        id: 's1', customer_id: null, channel: 'voice',
        order_draft: buildEmptyOrderDraft(),
        llm_history: [], status: 'taking_order',
        phone_number: null, stripe_payment_link: null,
        stripe_payment_intent_id: null, order_id: null,
        created_at: '', last_activity: '',
      };
    });

    it('add_item adds item to order draft', () => {
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'add_item', arguments: JSON.stringify({ product_id: 'p1', quantity: 2, name: 'Super Smash Bros', unit_price: 10, modifiers: [] }) } },
        session,
        mockProducts,
      );
      expect(result.orderUpdate.items).toHaveLength(1);
      expect(result.orderUpdate.items![0].quantity).toBe(2);
      expect(result.toolResult).toContain('añadido');
    });

    it('add_item increments quantity for existing item', () => {
      session.order_draft.items = [{ product_id: 'p1', name: 'Super Smash Bros', quantity: 1, unit_price: 10, modifiers: [] }];
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'add_item', arguments: JSON.stringify({ product_id: 'p1', quantity: 1, name: 'Super Smash Bros', unit_price: 10, modifiers: [] }) } },
        session,
        mockProducts,
      );
      expect(result.orderUpdate.items![0].quantity).toBe(2);
    });

    it('remove_item removes item from order draft', () => {
      session.order_draft.items = [{ product_id: 'p1', name: 'Super Smash Bros', quantity: 1, unit_price: 10, modifiers: [] }];
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'remove_item', arguments: JSON.stringify({ product_id: 'p1' }) } },
        session,
        mockProducts,
      );
      expect(result.orderUpdate.items).toHaveLength(0);
    });

    it('confirm_order sets draft status to confirmed', () => {
      session.order_draft.items = [{ product_id: 'p1', name: 'Super Smash Bros', quantity: 1, unit_price: 10, modifiers: [] }];
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'confirm_order', arguments: '{}' } },
        session,
        mockProducts,
      );
      expect(result.triggerPayment).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Verificar que falla**

```bash
npx jest tests/unit/llmOrchestrator.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implementar LLMOrchestrator**

```typescript
// src/services/llmOrchestrator.ts
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import {
  NormalizedInput, SessionRow, ProductRow, LLMMessage,
  ToolCall, LLMResponse, DraftItem,
} from '../types/conversation';

// ─── OpenAI-compatible client pointing at OpenRouter ───────────────────────
function getOpenRouterClient(): OpenAI {
  return new OpenAI({
    apiKey: config.openrouter.apiKey ?? 'no-key',
    baseURL: config.openrouter.baseUrl,
  });
}

// ─── Fetch menu from Supabase ───────────────────────────────────────────────
export async function fetchMenu(tenantSlug: string): Promise<ProductRow[]> {
  const client = createClient(config.supabase.url, config.supabase.serviceKey);
  const db = client.schema(`restaurant_${tenantSlug}`) as ReturnType<typeof client.schema>;
  const { data, error } = await db
    .from('products')
    .select('id, name, price, category, description, is_available, allowed_modifications')
    .eq('is_available', true)
    .order('category')
    .order('price');

  if (error) throw new Error(`fetchMenu failed: ${error.message}`);
  return (data ?? []) as ProductRow[];
}

// ─── Build system prompt ────────────────────────────────────────────────────
export function buildSystemPrompt(restaurantName: string, products: ProductRow[]): string {
  const menuText = ['burger', 'racion', 'postre'].map(cat => {
    const items = products.filter(p => p.category === cat);
    if (!items.length) return '';
    const label = cat === 'burger' ? 'HAMBURGUESAS' : cat === 'racion' ? 'RACIONES' : 'POSTRES';
    return `${label}:\n${items.map(p => `  - ${p.name}: ${p.price.toFixed(2)}€ — ${p.description}`).join('\n')}`;
  }).filter(Boolean).join('\n\n');

  return `Eres el asistente de pedidos de ${restaurantName}, una smashburger en Pamplona.
Tu único trabajo es tomar pedidos de forma natural y amigable en español.

REGLAS ESTRICTAS:
- Solo puedes ofrecer productos del menú. No inventes productos ni precios.
- No autorices descuentos ni precios especiales.
- Si el cliente pregunta algo fuera del menú, redirige amablemente.
- Habla en español, tono cercano y eficiente.
- Cuando el cliente confirme el pedido, usa la función confirm_order.
- En llamadas de voz, cuando necesites enviar el link de pago, usa request_phone_number si no tienes el número.

MENÚ ACTUAL:
${menuText}`;
}

// ─── Function calling tools definition ─────────────────────────────────────
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'add_item',
      description: 'Añade un producto al pedido actual',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'UUID del producto' },
          name: { type: 'string', description: 'Nombre del producto' },
          quantity: { type: 'number', description: 'Cantidad' },
          unit_price: { type: 'number', description: 'Precio unitario en euros' },
          modifiers: { type: 'array', items: { type: 'string' }, description: 'Modificaciones (ej: sin pepinillos)' },
        },
        required: ['product_id', 'name', 'quantity', 'unit_price'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_item',
      description: 'Elimina un producto del pedido',
      parameters: {
        type: 'object',
        properties: { product_id: { type: 'string' } },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_summary',
      description: 'Obtiene el resumen del pedido actual con precio total',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirm_order',
      description: 'Confirma el pedido y dispara el proceso de pago. Solo llamar cuando el cliente diga explícitamente que quiere confirmar.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_phone_number',
      description: 'Pide el número de teléfono al cliente para enviarle el link de pago. Solo usar en canal de voz.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ─── Apply a single tool call, return updated order state ───────────────────
export function applyToolCall(
  call: ToolCall,
  session: SessionRow,
  products: ProductRow[],
): { toolResult: string; orderUpdate: Partial<{ items: DraftItem[]; status: 'taking_order' | 'confirmed' }>; triggerPayment?: boolean } {
  const args = JSON.parse(call.function.arguments);
  const items = [...(session.order_draft.items ?? [])];

  switch (call.function.name) {
    case 'add_item': {
      const existing = items.find(i => i.product_id === args.product_id);
      if (existing) {
        existing.quantity += args.quantity;
      } else {
        items.push({
          product_id: args.product_id,
          name: args.name,
          quantity: args.quantity,
          unit_price: args.unit_price,
          modifiers: args.modifiers ?? [],
        });
      }
      return { toolResult: `${args.name} x${args.quantity} añadido al pedido`, orderUpdate: { items } };
    }

    case 'remove_item': {
      const filtered = items.filter(i => i.product_id !== args.product_id);
      return { toolResult: 'Producto eliminado del pedido', orderUpdate: { items: filtered } };
    }

    case 'get_order_summary': {
      if (!items.length) return { toolResult: 'El pedido está vacío', orderUpdate: {} };
      const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
      const lines = items.map(i => `${i.name} x${i.quantity} = ${(i.unit_price * i.quantity).toFixed(2)}€`);
      return { toolResult: `Resumen: ${lines.join(', ')}. Total: ${total.toFixed(2)}€`, orderUpdate: {} };
    }

    case 'confirm_order': {
      return { toolResult: 'Pedido confirmado. Generando link de pago...', orderUpdate: { status: 'confirmed' }, triggerPayment: true };
    }

    case 'request_phone_number': {
      return { toolResult: 'Solicitando número de teléfono al cliente', orderUpdate: {} };
    }

    default:
      return { toolResult: 'Función desconocida', orderUpdate: {} };
  }
}

// ─── Main orchestration function ────────────────────────────────────────────
export async function processMessage(
  input: NormalizedInput,
  session: SessionRow,
  restaurantName = 'El Mesón',
): Promise<LLMResponse> {
  const products = await fetchMenu(input.tenantSlug);
  const systemPrompt = buildSystemPrompt(restaurantName, products);
  const client = getOpenRouterClient();

  const history: LLMMessage[] = [...(session.llm_history ?? [])];
  history.push({ role: 'user', content: input.text });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ];

  const firstResponse = await client.chat.completions.create({
    model: config.openrouter.model,
    messages,
    tools: TOOLS,
    tool_choice: 'auto',
  });

  const assistantMsg = firstResponse.choices[0].message;
  let triggerPayment = false;
  let orderDraftUpdate = { ...session.order_draft };

  if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
    // Push assistant message with tool calls to history
    history.push(assistantMsg as LLMMessage);

    for (const call of assistantMsg.tool_calls) {
      const { toolResult, orderUpdate, triggerPayment: tp } = applyToolCall(call as ToolCall, session, products);
      if (tp) triggerPayment = true;
      if (orderUpdate.items !== undefined) orderDraftUpdate.items = orderUpdate.items;
      if (orderUpdate.status !== undefined) orderDraftUpdate.status = orderUpdate.status;

      history.push({ role: 'tool', tool_call_id: call.id, content: toolResult });
    }

    // Get final text response after tool execution
    const finalResponse = await client.chat.completions.create({
      model: config.openrouter.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      ],
    });

    const finalText = finalResponse.choices[0].message.content ?? '';
    history.push({ role: 'assistant', content: finalText });

    const newStatus = triggerPayment ? 'awaiting_payment' : session.status === 'greeting' ? 'taking_order' : session.status;

    return {
      reply: finalText,
      triggerPayment,
      sessionUpdate: {
        llm_history: history,
        order_draft: orderDraftUpdate,
        status: newStatus as SessionRow['status'],
      },
    };
  }

  const reply = assistantMsg.content ?? '';
  history.push({ role: 'assistant', content: reply });

  const newStatus = session.status === 'greeting' ? 'taking_order' : session.status;

  return {
    reply,
    sessionUpdate: {
      llm_history: history,
      order_draft: orderDraftUpdate,
      status: newStatus as SessionRow['status'],
    },
  };
}
```

- [ ] **Step 4: Verificar que los tests pasan**

```bash
npx jest tests/unit/llmOrchestrator.test.ts
```

Expected: PASS (8 tests)

- [ ] **Step 5: Verificar compilación**

```bash
npx tsc --noEmit
```

Expected: 0 errores

- [ ] **Step 6: Commit**

```bash
git add src/services/llmOrchestrator.ts tests/unit/llmOrchestrator.test.ts
git commit -m "feat: add LLMOrchestrator — OpenRouter + function calling para tomar pedidos"
```

---

## Task 8: OutputRouter (ElevenLabs TTS + WhatsApp)

**Files:**
- Create: `src/services/outputRouter.ts`
- Create: `tests/unit/outputRouter.test.ts`

- [ ] **Step 1: Escribir test fallido**

```typescript
// tests/unit/outputRouter.test.ts
import { buildTwilioAudioMessage, estimateAudioDurationMs } from '../../src/services/outputRouter';

describe('OutputRouter', () => {
  describe('buildTwilioAudioMessage', () => {
    it('wraps base64 audio in Twilio media event format', () => {
      const msg = buildTwilioAudioMessage('streamSid123', 'abc123base64');
      const parsed = JSON.parse(msg);
      expect(parsed.event).toBe('media');
      expect(parsed.streamSid).toBe('streamSid123');
      expect(parsed.media.payload).toBe('abc123base64');
    });
  });

  describe('estimateAudioDurationMs', () => {
    it('estimates duration from buffer length (ulaw 8000Hz mono)', () => {
      // ulaw 8000Hz = 8000 bytes per second
      const buffer = Buffer.alloc(8000); // 1 second
      expect(estimateAudioDurationMs(buffer)).toBe(1000);
    });
  });
});
```

- [ ] **Step 2: Verificar que falla**

```bash
npx jest tests/unit/outputRouter.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implementar OutputRouter**

```typescript
// src/services/outputRouter.ts
import WebSocket from 'ws';
import { config } from '../config/env';

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_MODEL = 'eleven_turbo_v2_5';

// ─── Twilio helpers ──────────────────────────────────────────────────────────

export function buildTwilioAudioMessage(streamSid: string, base64Audio: string): string {
  return JSON.stringify({
    event: 'media',
    streamSid,
    media: { payload: base64Audio },
  });
}

// ulaw 8000Hz mono = 8000 bytes/s
export function estimateAudioDurationMs(audioBuffer: Buffer): number {
  return Math.round((audioBuffer.length / 8000) * 1000);
}

// ─── ElevenLabs TTS → Twilio WebSocket ──────────────────────────────────────

export async function synthesizeAndSendVoice(
  ws: WebSocket,
  streamSid: string,
  text: string,
): Promise<void> {
  const voiceId = config.elevenlabs.voiceId;
  const apiKey = config.elevenlabs.apiKey;

  if (!apiKey) {
    console.warn('[outputRouter] ELEVENLABS_API_KEY not set — skipping TTS');
    return;
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      output_format: 'ulaw_8000',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${response.status} — ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  const base64Audio = audioBuffer.toString('base64');

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(buildTwilioAudioMessage(streamSid, base64Audio));
    // Send mark event so Twilio knows audio ended
    ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'tts_end' } }));
  }
}

// ─── WhatsApp reply via Evolution API ───────────────────────────────────────

export async function sendWhatsAppText(to: string, text: string): Promise<void> {
  const apiUrl = config.evolution.apiUrl;
  const instance = config.evolution.instance;

  if (!apiUrl || !instance) {
    // Evolution API not configured — log only (expected during dev without it running)
    console.log(`[outputRouter][whatsapp] → ${to}: ${text}`);
    return;
  }

  const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      number: to,
      options: { delay: 200 },
      textMessage: { text },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Evolution API sendText failed: ${response.status} — ${errText}`);
  }
}
```

- [ ] **Step 4: Verificar tests**

```bash
npx jest tests/unit/outputRouter.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/outputRouter.ts tests/unit/outputRouter.test.ts
git commit -m "feat: add OutputRouter — ElevenLabs TTS to Twilio WS + WhatsApp via Evolution API"
```

---

## Task 9: PaymentService

**Files:**
- Create: `src/services/paymentService.ts`
- Create: `tests/unit/paymentService.test.ts`

- [ ] **Step 1: Escribir test fallido**

```typescript
// tests/unit/paymentService.test.ts
import { buildStripeMetadata, calculateTotal } from '../../src/services/paymentService';
import { DraftItem } from '../../src/types/conversation';

describe('PaymentService', () => {
  describe('calculateTotal', () => {
    it('sums items correctly', () => {
      const items: DraftItem[] = [
        { product_id: 'p1', name: 'Super Smash Bros', quantity: 2, unit_price: 10, modifiers: [] },
        { product_id: 'p2', name: 'Patatas Fritas', quantity: 1, unit_price: 6, modifiers: [] },
      ];
      expect(calculateTotal(items)).toBe(26); // 2*10 + 1*6
    });

    it('returns 0 for empty items', () => {
      expect(calculateTotal([])).toBe(0);
    });
  });

  describe('buildStripeMetadata', () => {
    it('includes order_id, tenant_slug and session_id', () => {
      const meta = buildStripeMetadata('order-123', '001', 'session-abc');
      expect(meta).toEqual({ order_id: 'order-123', tenant_slug: '001', session_id: 'session-abc' });
    });
  });
});
```

- [ ] **Step 2: Verificar que falla**

```bash
npx jest tests/unit/paymentService.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implementar PaymentService**

```typescript
// src/services/paymentService.ts
import Stripe from 'stripe';
import { config } from '../config/env';
import { DraftItem } from '../types/conversation';

function getStripeClient(): Stripe {
  const key = config.stripe.secretKey;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-12-18.acacia' });
}

export function calculateTotal(items: DraftItem[]): number {
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
}

export function buildStripeMetadata(
  orderId: string,
  tenantSlug: string,
  sessionId: string,
): Record<string, string> {
  return { order_id: orderId, tenant_slug: tenantSlug, session_id: sessionId };
}

export async function createPaymentLink(
  orderId: string,
  tenantSlug: string,
  sessionId: string,
  items: DraftItem[],
  restaurantName = 'El Mesón',
): Promise<string> {
  const stripe = getStripeClient();
  const totalCents = Math.round(calculateTotal(items) * 100);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.modifiers.length > 0 ? item.modifiers.join(', ') : undefined,
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    })),
    metadata: buildStripeMetadata(orderId, tenantSlug, sessionId),
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60, // 15 min
    success_url: `${config.baseUrl ?? 'https://example.com'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.baseUrl ?? 'https://example.com'}/payment/cancel`,
  });

  if (!session.url) throw new Error('Stripe session has no URL');
  return session.url;
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
  const webhookSecret = config.stripe.webhookSecret;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
```

- [ ] **Step 4: Verificar tests**

```bash
npx jest tests/unit/paymentService.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/paymentService.ts tests/unit/paymentService.test.ts
git commit -m "feat: add PaymentService — Stripe Checkout Sessions + webhook verification"
```

---

## Task 10: Wire voice route con pipeline completo

**Files:**
- Modify: `src/routes/voice.ts`

- [ ] **Step 1: Reemplazar src/routes/voice.ts**

```typescript
// src/routes/voice.ts
import expressWs from 'express-ws';
import WebSocket from 'ws';
import { createClient as createDeepgramClient, LiveTranscriptionEvent } from '@deepgram/sdk';
import { config } from '../config/env';
import { normalizeVoiceInput } from '../services/inputNormalizer';
import { getOrCreateSessionByPhone, updateSession } from '../services/sessionManager';
import { processMessage } from '../services/llmOrchestrator';
import { synthesizeAndSendVoice } from '../services/outputRouter';
import { createPaymentLink } from '../services/paymentService';

export function applyVoiceRoutes(wsApp: expressWs.Application): void {
  wsApp.ws('/voice/:restaurantSlug', (ws, req) => {
    const { restaurantSlug } = req.params;

    if (!/^[a-z0-9_]+$/.test(restaurantSlug)) {
      ws.close(1008, 'Invalid tenant');
      return;
    }

    console.log(`[voice] New call for tenant: ${restaurantSlug}`);

    let dgFinished = false;
    let streamSid = '';
    let callerNumber = '';
    let sessionId = '';

    const deepgram = createDeepgramClient(config.deepgram.apiKey);

    const dgLive = deepgram.listen.live({
      model: 'nova-2',
      language: 'es',
      encoding: 'mulaw',
      sample_rate: 8000,
      channels: 1,
      endpointing: 300,
      utterance_end_ms: 1000,
      interim_results: false,
    });

    dgLive.on('open', () => {
      console.log(`[voice][${restaurantSlug}] Deepgram connection opened`);
    });

    dgLive.on('transcript', async (data: LiveTranscriptionEvent) => {
      const transcript = data?.channel?.alternatives?.[0]?.transcript ?? '';
      if (!transcript.trim()) return;

      console.log(`[voice][${restaurantSlug}] Transcript: "${transcript}"`);

      const input = normalizeVoiceInput(restaurantSlug, sessionId || streamSid, transcript, callerNumber);
      if (!input) return;

      try {
        // Get or create session keyed by caller phone
        const session = await getOrCreateSessionByPhone(restaurantSlug, callerNumber || streamSid, 'voice');

        const llmResponse = await processMessage(input, session);

        // Persist session updates
        await updateSession(restaurantSlug, session.id, llmResponse.sessionUpdate);

        // Handle payment trigger
        // Use updated draft from this turn (items may have been added in same message as confirm)
        const currentItems = llmResponse.sessionUpdate.order_draft?.items ?? session.order_draft.items;
        if (llmResponse.triggerPayment && currentItems.length > 0) {
          try {
            const paymentUrl = await createPaymentLink(
              session.id, // use session id as order ref in F2
              restaurantSlug,
              session.id,
              currentItems,
            );
            await updateSession(restaurantSlug, session.id, {
              stripe_payment_link: paymentUrl,
              status: 'awaiting_payment',
            });
            // Reply includes the link mention — LLM already crafted the message
          } catch (err) {
            console.error(`[voice][${restaurantSlug}] Stripe error:`, (err as Error).message);
          }
        }

        // Speak the reply
        if (llmResponse.reply && ws.readyState === WebSocket.OPEN) {
          await synthesizeAndSendVoice(ws, streamSid, llmResponse.reply);
        }
      } catch (err) {
        console.error(`[voice][${restaurantSlug}] Pipeline error:`, (err as Error).message);
      }
    });

    dgLive.on('error', (err: Error) => {
      console.error(`[voice][${restaurantSlug}] Deepgram error:`, err.message);
    });

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          event: string;
          start?: { streamSid: string; callSid: string; customParameters?: Record<string, string> };
          media?: { payload: string };
        };

        if (msg.event === 'start' && msg.start) {
          streamSid = msg.start.streamSid;
          callerNumber = msg.start.customParameters?.['callerNumber'] ?? '';
          sessionId = msg.start.callSid;
          console.log(`[voice][${restaurantSlug}] Stream started: ${streamSid}, caller: ${callerNumber}`);
        } else if (msg.event === 'media' && msg.media?.payload) {
          const audioBuffer = Buffer.from(msg.media.payload, 'base64');
          dgLive.send(audioBuffer.buffer.slice(
            audioBuffer.byteOffset,
            audioBuffer.byteOffset + audioBuffer.byteLength,
          ) as ArrayBuffer);
        } else if (msg.event === 'stop') {
          console.log(`[voice][${restaurantSlug}] Call ended`);
          if (!dgFinished) { dgFinished = true; dgLive.finish(); }
        }
      } catch {
        // Malformed message — ignore
      }
    });

    ws.on('close', () => {
      if (!dgFinished) { dgFinished = true; dgLive.finish(); }
      console.log(`[voice][${restaurantSlug}] WebSocket closed`);
    });
  });
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Expected: 0 errores

- [ ] **Step 3: Verificar tests existentes no rotos**

```bash
npx jest tests/unit tests/integration
```

Expected: 19 tests PASS (existentes de F1)

- [ ] **Step 4: Commit**

```bash
git add src/routes/voice.ts
git commit -m "feat: wire voice route — Deepgram transcript → LLM → ElevenLabs TTS pipeline"
```

---

## Task 11: Wire WhatsApp route con pipeline completo

**Files:**
- Modify: `src/routes/whatsapp.ts`

- [ ] **Step 1: Reemplazar src/routes/whatsapp.ts**

```typescript
// src/routes/whatsapp.ts
import { Router } from 'express';
import { config } from '../config/env';
import { normalizeWhatsAppInput } from '../services/inputNormalizer';
import { getOrCreateSessionByPhone, updateSession } from '../services/sessionManager';
import { processMessage } from '../services/llmOrchestrator';
import { sendWhatsAppText } from '../services/outputRouter';
import { createPaymentLink } from '../services/paymentService';

const router = Router();

interface WhatsAppMessage {
  from: string;
  text?: { body: string };
  type: string;
  timestamp: string;
}

// Meta webhook verification (GET)
router.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.meta.verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

// Incoming messages (POST)
router.post('/webhooks/whatsapp', (req, res) => {
  const body = req.body;
  res.status(200).json({ received: true });
  processWhatsAppEvent(body, '001').catch((err: Error) => {
    console.error('[whatsapp] Processing error:', err.message);
  });
});

async function processWhatsAppEvent(body: Record<string, unknown>, tenantSlug: string): Promise<void> {
  const entries = (body.entry as Array<Record<string, unknown>>) ?? [];

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      const value = change.value as Record<string, unknown>;
      const messages = (value.messages as WhatsAppMessage[]) ?? [];

      for (const message of messages) {
        if (message.type !== 'text' || !message.text) continue;

        const input = normalizeWhatsAppInput(tenantSlug, message.from, message.text.body);
        if (!input) continue;

        try {
          const session = await getOrCreateSessionByPhone(tenantSlug, message.from, 'whatsapp');
          const llmResponse = await processMessage(input, session);

          await updateSession(tenantSlug, session.id, llmResponse.sessionUpdate);

          // Use updated draft from this turn (items may have been added in same message as confirm)
          const currentItems = llmResponse.sessionUpdate.order_draft?.items ?? session.order_draft.items;
          if (llmResponse.triggerPayment && currentItems.length > 0) {
            try {
              const paymentUrl = await createPaymentLink(
                session.id,
                tenantSlug,
                session.id,
                currentItems,
              );
              await updateSession(tenantSlug, session.id, {
                stripe_payment_link: paymentUrl,
                status: 'awaiting_payment',
              });
              // Send payment link directly in chat
              await sendWhatsAppText(message.from, `${llmResponse.reply}\n\n💳 Paga aquí: ${paymentUrl}`);
            } catch (err) {
              console.error(`[whatsapp] Stripe error:`, (err as Error).message);
              await sendWhatsAppText(message.from, 'Hubo un problema al generar el link de pago. Por favor inténtalo de nuevo.');
            }
            continue;
          }

          await sendWhatsAppText(message.from, llmResponse.reply);
        } catch (err) {
          console.error(`[whatsapp] Pipeline error for ${message.from}:`, (err as Error).message);
        }
      }
    }
  }
}

export default router;
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

Expected: 0 errores

- [ ] **Step 3: Verificar tests F1 intactos**

```bash
npx jest tests/integration/whatsapp.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/routes/whatsapp.ts
git commit -m "feat: wire WhatsApp route — incoming text → LLM → reply via Evolution API"
```

---

## Task 12: Stripe Webhook Route

**Files:**
- Create: `src/routes/stripeWebhook.ts`
- Modify: `src/app.ts`

- [ ] **Step 1: Crear route**

```typescript
// src/routes/stripeWebhook.ts
import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../services/paymentService';
import { updateSession } from '../services/sessionManager';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

const router = Router();

// Raw body needed for Stripe signature verification — registered BEFORE express.json()
router.post('/webhooks/stripe', (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event;
  try {
    event = verifyWebhookSignature(req.body as Buffer, sig);
  } catch (err) {
    console.error('[stripe] Webhook signature invalid:', (err as Error).message);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  // Acknowledge immediately
  res.status(200).json({ received: true });

  // Process asynchronously
  handleStripeEvent(event).catch(err => {
    console.error('[stripe] Event processing error:', (err as Error).message);
  });
});

async function handleStripeEvent(event: { type: string; data: { object: Record<string, unknown> } }): Promise<void> {
  if (event.type !== 'checkout.session.completed') return;

  const session = event.data.object;
  const metadata = session['metadata'] as Record<string, string> | undefined;
  if (!metadata?.session_id || !metadata?.tenant_slug) {
    console.error('[stripe] Missing metadata in checkout session');
    return;
  }

  const { session_id, tenant_slug } = metadata;

  console.log(`[stripe] Payment confirmed for session ${session_id} (tenant: ${tenant_slug})`);

  // Update conversation session status to paid
  await updateSession(tenant_slug, session_id, {
    status: 'paid',
    stripe_payment_intent_id: session['payment_intent'] as string ?? undefined,
  });

  // Update order status in orders table if order_id present
  const orderId = metadata.order_id;
  if (orderId) {
    const client = createClient(config.supabase.url, config.supabase.serviceKey);
    const db = client.schema(`restaurant_${tenant_slug}`) as ReturnType<typeof client.schema>;
    await db
      .from('orders')
      .update({ status: 'paid', payment: { status: 'paid', paid_at: new Date().toISOString(), stripe_payment_intent_id: session['payment_intent'] } })
      .eq('id', orderId);
  }
}

export default router;
```

- [ ] **Step 2: Actualizar app.ts para registrar el webhook ANTES de express.json()**

```typescript
// src/app.ts
import express from 'express';
import expressWs from 'express-ws';
import healthRouter from './routes/health';
import whatsappRouter from './routes/whatsapp';
import stripeWebhookRouter from './routes/stripeWebhook';
import { applyVoiceRoutes } from './routes/voice';
import twimlRouter from './routes/twiml';

export function createApp() {
  const app = express();
  const { app: wsApp } = expressWs(app);

  // Stripe webhook MUST receive raw body — register BEFORE express.json()
  wsApp.use('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRouter);

  wsApp.use(express.json({ limit: '50kb' }));
  wsApp.use(healthRouter);
  wsApp.use(whatsappRouter);
  wsApp.use(twimlRouter);
  applyVoiceRoutes(wsApp);

  return wsApp;
}
```

- [ ] **Step 3: Verificar compilación**

```bash
npx tsc --noEmit
```

Expected: 0 errores

- [ ] **Step 4: Verificar todos los tests**

```bash
npx jest
```

Expected: todos PASS

- [ ] **Step 5: Commit**

```bash
git add src/routes/stripeWebhook.ts src/app.ts
git commit -m "feat: add Stripe webhook route — payment.succeeded → update session status to paid"
```

---

## Task 13: Smoke test manual end-to-end

> Verificación manual antes de dar F2 por completo. Requiere ngrok corriendo y Twilio webhook configurado.

- [ ] **Step 1: Arrancar servidor**

```bash
npm run dev
```

Expected: `Server running on port 3000`

- [ ] **Step 2: Exponer con ngrok**

```bash
# En otra terminal
npx ngrok http 3000
```

Anota la URL pública, ej: `https://abc123.ngrok.io`

- [ ] **Step 3: Configurar Twilio webhook**

En Twilio Console → Phone Numbers → +19384653399 → Voice Configuration:
- Webhook URL: `https://abc123.ngrok.io/twiml/voice/001`
- HTTP Method: POST

- [ ] **Step 4: Test de voz**

Llama al `+1 (938) 465-3399`. Deberías escuchar que la IA saluda en español en <3 segundos.

Expected en logs del servidor:
```
[voice] New call for tenant: 001
[voice][001] Stream started: MZ...
[voice][001] Deepgram connection opened
[voice][001] Transcript: "hola"
```

- [ ] **Step 5: Test de WhatsApp (si Evolution API está corriendo)**

Envía un mensaje al número de WhatsApp conectado. Deberías recibir respuesta de la IA.

- [ ] **Step 6: Verificar pedido en Supabase**

```sql
SELECT id, status, order_draft, phone_number
FROM restaurant_001.sessions
ORDER BY created_at DESC
LIMIT 5;
```

Expected: filas con `status = 'taking_order'` o `'awaiting_payment'`

- [ ] **Step 7: Commit final de F2**

```bash
git tag f2-complete
git push origin master --tags
```

---

## Verificación final de compilación y tests

```bash
npx tsc --noEmit && npx jest
```

Expected: 0 errores TypeScript, todos los tests PASS.
