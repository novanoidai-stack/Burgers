# F1: Infrastructure Base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a working Node.js + TypeScript API Gateway connected to Supabase multi-tenant schema, with WhatsApp webhook receiver and Twilio voice WebSocket handler passing an audio stream through Deepgram STT.

**Architecture:** Express app with schema-level multi-tenancy via Supabase (each restaurant = its own PostgreSQL schema). Every route is tenant-scoped via JWT middleware. Two inbound channels: WhatsApp (HTTP webhook) and Voice (WebSocket + Deepgram STT). No LLM calls in F1 — inputs are logged and orders are inserted directly for validation.

**Tech Stack:** Node.js 20+, TypeScript 5, Express 4, Supabase JS v2, Deepgram SDK v3, Twilio, Jest + ts-jest + supertest, Docker Compose.

---

## File Map

```
novo-food/
├── package.json
├── tsconfig.json
├── jest.config.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example                               (already exists — verified)
├── src/
│   ├── index.ts                               # Express app bootstrap
│   ├── app.ts                                 # App factory (testable without listen)
│   ├── config/
│   │   └── env.ts                             # Env validation + typed config object
│   ├── types/
│   │   └── order.ts                           # TypeScript interfaces for Order, Item, etc.
│   ├── db/
│   │   ├── publicClient.ts                    # Supabase client scoped to `public` schema
│   │   ├── tenantClient.ts                    # Factory: returns client for restaurant_XXX schema
│   │   └── migrations/
│   │       ├── 001_public_schema.sql          # tenants, users tables
│   │       └── 002_restaurant_schema.sql      # Template: orders, products, customers, sessions, snapshots
│   ├── middleware/
│   │   └── auth.ts                            # JWT decode + tenant validation + req.tenant injection
│   └── routes/
│       ├── health.ts                          # GET /health
│       ├── whatsapp.ts                        # POST /webhooks/whatsapp
│       └── voice.ts                           # WebSocket /voice/:restaurantSlug
└── tests/
    ├── unit/
    │   ├── config/env.test.ts
    │   ├── db/tenantClient.test.ts
    │   └── middleware/auth.test.ts
    └── integration/
        ├── routes/health.test.ts
        ├── routes/whatsapp.test.ts
        └── db/orderInsert.test.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `jest.config.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "novo-food",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration"
  },
  "dependencies": {
    "@deepgram/sdk": "^3.9.0",
    "@supabase/supabase-js": "^2.45.0",
    "express": "^4.19.0",
    "express-ws": "^5.0.2",
    "jsonwebtoken": "^9.0.2",
    "twilio": "^5.3.0",
    "ws": "^8.18.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "@types/supertest": "^6.0.2",
    "@types/ws": "^8.5.10",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80 }
  },
  setupFiles: ['<rootDir>/tests/setup.ts']
};

export default config;
```

- [ ] **Step 4: Create `tests/setup.ts`**

```typescript
// Inject test env vars before any module loads
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum!!';
process.env.DEEPGRAM_API_KEY = 'test-deepgram-key';
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

Expected: `node_modules` directory created, no errors.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No output (no errors). If `src/` doesn't exist yet, create `src/.gitkeep` first.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json jest.config.ts tests/setup.ts
git commit -m "chore: scaffold Node.js + TypeScript project with Jest"
```

---

## Task 2: Environment Config

**Files:**
- Create: `src/config/env.ts`
- Create: `tests/unit/config/env.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/config/env.test.ts
import { loadConfig, ConfigError } from '../../../src/config/env';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns typed config when all required vars present', () => {
    process.env.SUPABASE_URL = 'https://abc.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_KEY = 'service-key';
    process.env.JWT_SECRET = 'a-secret-that-is-32-chars-minimum!';
    process.env.DEEPGRAM_API_KEY = 'dg-key';

    const config = loadConfig();

    expect(config.supabase.url).toBe('https://abc.supabase.co');
    expect(config.jwt.secret).toBe('a-secret-that-is-32-chars-minimum!');
    expect(config.port).toBe(3000);
  });

  it('throws ConfigError when SUPABASE_URL is missing', () => {
    delete process.env.SUPABASE_URL;

    expect(() => loadConfig()).toThrow(ConfigError);
  });

  it('uses PORT env var when set', () => {
    process.env.PORT = '4000';
    const config = loadConfig();
    expect(config.port).toBe(4000);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test tests/unit/config/env.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/config/env'`

- [ ] **Step 3: Implement `src/config/env.ts`**

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
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
});

export type Config = {
  supabase: { url: string; anonKey: string; serviceKey: string };
  jwt: { secret: string };
  port: number;
  env: 'development' | 'test' | 'production';
  twilio: { accountSid?: string; authToken?: string };
  elevenlabs: { apiKey?: string };
  stripe: { secretKey?: string };
  meta: { verifyToken?: string };
  deepgram: { apiKey: string };
};

export function loadConfig(): Config {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map(i => i.path.join('.')).join(', ');
    throw new ConfigError(`Missing or invalid env vars: ${missing}`);
  }

  const e = result.data;
  return {
    supabase: { url: e.SUPABASE_URL, anonKey: e.SUPABASE_ANON_KEY, serviceKey: e.SUPABASE_SERVICE_KEY },
    jwt: { secret: e.JWT_SECRET },
    port: e.PORT,
    env: e.NODE_ENV,
    twilio: { accountSid: e.TWILIO_ACCOUNT_SID, authToken: e.TWILIO_AUTH_TOKEN },
    elevenlabs: { apiKey: e.ELEVENLABS_API_KEY },
    stripe: { secretKey: e.STRIPE_SECRET_KEY },
    meta: { verifyToken: e.META_VERIFY_TOKEN },
    deepgram: { apiKey: e.DEEPGRAM_API_KEY },
  };
}

// Singleton — loaded once at startup, throws if env is broken
export const config = loadConfig();
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm test tests/unit/config/env.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/config/env.ts tests/unit/config/env.test.ts tests/setup.ts
git commit -m "feat: add env config validation with zod"
```

---

## Task 3: TypeScript Types (Order Contract)

**Files:**
- Create: `src/types/order.ts`

No tests needed — these are pure type definitions with no runtime logic.

- [ ] **Step 1: Create `src/types/order.ts`**

```typescript
export type Channel = 'voice' | 'whatsapp' | 'web';
export type DeliveryType = 'takeaway' | 'delivery' | 'table';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'sent_to_tpv'
  | 'in_preparation'
  | 'ready'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'stripe' | 'mercado_pago' | 'cash';

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  modifications: string[];
  unit_price: number;
  subtotal: number;
}

export interface OrderDelivery {
  type: DeliveryType;
  address?: {
    street: string;
    city: string;
    postal_code: string;
    notes?: string;
  };
  table_number?: string;
  estimated_time_min?: number;
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax: number;
  delivery_fee: number;
  total: number;
}

export interface OrderPayment {
  status: PaymentStatus;
  method?: PaymentMethod;
  stripe_payment_intent_id?: string;
  link?: string;
  paid_at?: string;
}

export interface OrderClient {
  phone: string;
  name?: string;
  email?: string;
}

export interface Order {
  id: string;
  session_id: string;
  channel: Channel;
  restaurant_id: string;
  client: OrderClient;
  delivery: OrderDelivery;
  items: OrderItem[];
  summary: OrderSummary;
  payment: OrderPayment;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type OrderDraft = Omit<Order, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
```

- [ ] **Step 2: Verify TypeScript accepts the types**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/order.ts
git commit -m "feat: add TypeScript Order types"
```

---

## Task 4: Supabase Migrations

**Files:**
- Create: `src/db/migrations/001_public_schema.sql`
- Create: `src/db/migrations/002_restaurant_schema.sql`

These SQL files are run manually in the Supabase SQL editor (or via a migration runner). No automated tests for raw SQL in F1.

- [ ] **Step 1: Create `src/db/migrations/001_public_schema.sql`**

```sql
-- Run this ONCE in Supabase SQL editor (public schema)
-- Creates platform-level tables shared across all tenants

CREATE TABLE IF NOT EXISTS public.tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,          -- e.g. '001', '002'
  name        TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'connect' CHECK (plan IN ('connect', 'pro', 'total')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff', 'platform_admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Burger-AI as first tenant
INSERT INTO public.tenants (slug, name, plan)
VALUES ('001', 'Burger-AI', 'pro')
ON CONFLICT (slug) DO NOTHING;
```

- [ ] **Step 2: Create `src/db/migrations/002_restaurant_schema.sql`**

```sql
-- Run this PER TENANT, replacing :SLUG with the tenant slug (e.g. '001')
-- Example: run for restaurant_001

DO $$
DECLARE schema_name TEXT := 'restaurant_001';  -- CHANGE THIS per tenant
BEGIN

  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.customers (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone       TEXT UNIQUE NOT NULL,
      name        TEXT,
      email       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', schema_name);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.products (
      id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name                   TEXT NOT NULL,
      price                  DECIMAL(10,2) NOT NULL,
      category               TEXT,
      description            TEXT,
      stock_qty              INTEGER NOT NULL DEFAULT -1,
      is_available           BOOLEAN NOT NULL DEFAULT true,
      allowed_modifications  JSONB NOT NULL DEFAULT ''[]'',
      estimated_cook_time    INTEGER NOT NULL DEFAULT 5,
      created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', schema_name);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.orders (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id  UUID,
      channel     TEXT NOT NULL CHECK (channel IN (''voice'', ''whatsapp'', ''web'')),
      customer_id UUID REFERENCES %I.customers(id),
      items       JSONB NOT NULL DEFAULT ''[]'',
      summary     JSONB NOT NULL DEFAULT ''{}'',
      delivery    JSONB NOT NULL DEFAULT ''{}'',
      payment     JSONB NOT NULL DEFAULT ''{}'',
      status      TEXT NOT NULL DEFAULT ''pending'',
      notes       TEXT,
      tpv_config  JSONB NOT NULL DEFAULT ''{}'',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', schema_name, schema_name);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.order_snapshots (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id     UUID NOT NULL REFERENCES %I.orders(id) ON DELETE CASCADE,
      snapshot     JSONB NOT NULL,
      event_type   TEXT NOT NULL,
      triggered_by TEXT NOT NULL DEFAULT ''system'',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', schema_name, schema_name);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.sessions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id   UUID REFERENCES %I.customers(id),
      channel       TEXT NOT NULL,
      order_draft   JSONB NOT NULL DEFAULT ''{}'',
      llm_history   JSONB NOT NULL DEFAULT ''[]'',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )', schema_name, schema_name);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.analytics_daily (
      date         DATE NOT NULL,
      product_id   UUID REFERENCES %I.products(id),
      product_name TEXT,
      units_sold   INTEGER NOT NULL DEFAULT 0,
      revenue      DECIMAL(10,2) NOT NULL DEFAULT 0,
      PRIMARY KEY (date, product_id)
    )', schema_name, schema_name);

  RAISE NOTICE 'Schema % created successfully', schema_name;
END $$;
```

- [ ] **Step 3: Run migrations in Supabase SQL Editor**

Open Supabase → SQL Editor:
1. Run `001_public_schema.sql` first
2. Run `002_restaurant_schema.sql` (with `schema_name := 'restaurant_001'`)

Verify in Supabase Table Editor that:
- `public.tenants` has 1 row: Burger-AI
- Schema `restaurant_001` exists with all 6 tables

- [ ] **Step 4: Commit**

```bash
git add src/db/migrations/
git commit -m "feat: add Supabase multi-tenant schema migrations"
```

---

## Task 5: Supabase DB Clients

**Files:**
- Create: `src/db/publicClient.ts`
- Create: `src/db/tenantClient.ts`
- Create: `tests/unit/db/tenantClient.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/db/tenantClient.test.ts
import { getTenantClient, TenantClientError } from '../../../src/db/tenantClient';

// Mock Supabase createClient to avoid real network calls
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url: string, key: string, options: Record<string, unknown>) => ({
    __url: url,
    __key: key,
    __options: options,
  })),
}));

describe('getTenantClient', () => {
  it('creates a client scoped to the restaurant schema', () => {
    const client = getTenantClient('001') as unknown as Record<string, unknown>;
    expect(client.__options).toMatchObject({ db: { schema: 'restaurant_001' } });
  });

  it('throws TenantClientError for invalid slug (contains special chars)', () => {
    expect(() => getTenantClient('001; DROP TABLE--')).toThrow(TenantClientError);
  });

  it('throws TenantClientError for empty slug', () => {
    expect(() => getTenantClient('')).toThrow(TenantClientError);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test tests/unit/db/tenantClient.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/db/tenantClient'`

- [ ] **Step 3: Create `src/db/publicClient.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Client for the `public` schema (tenants, users, billing)
export const publicClient = createClient(config.supabase.url, config.supabase.serviceKey);
```

- [ ] **Step 4: Create `src/db/tenantClient.ts`**

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';

export class TenantClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantClientError';
  }
}

const VALID_SLUG = /^[a-zA-Z0-9_-]+$/;

/**
 * Returns a Supabase client scoped to restaurant_{slug} schema.
 * All queries from this client are isolated to that tenant's data.
 */
export function getTenantClient(slug: string): SupabaseClient {
  if (!slug || !VALID_SLUG.test(slug)) {
    throw new TenantClientError(`Invalid tenant slug: "${slug}"`);
  }

  return createClient(config.supabase.url, config.supabase.serviceKey, {
    db: { schema: `restaurant_${slug}` },
  });
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
npm test tests/unit/db/tenantClient.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/db/publicClient.ts src/db/tenantClient.ts tests/unit/db/tenantClient.test.ts
git commit -m "feat: add Supabase public and tenant-scoped DB clients"
```

---

## Task 6: Auth Middleware

**Files:**
- Create: `src/middleware/auth.ts`
- Create: `tests/unit/middleware/auth.test.ts`

The middleware validates a JWT from the `Authorization: Bearer <token>` header, looks up the tenant slug in the token payload, and attaches `req.tenant` (slug string) to every authenticated request.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/middleware/auth.test.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireTenant, AuthError } from '../../../src/middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(payload: object, secret = JWT_SECRET) {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

function mockReq(token?: string): Partial<Request> {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

describe('requireTenant middleware', () => {
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('calls next() and sets req.tenant when token is valid', () => {
    const token = makeToken({ tenant: '001' });
    const req = mockReq(token) as Request;

    requireTenant(req, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as Request & { tenant: string }).tenant).toBe('001');
  });

  it('returns 401 when no Authorization header', () => {
    const req = mockReq() as Request;

    requireTenant(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalledWith();
  });

  it('returns 401 when token is expired', () => {
    const token = jwt.sign({ tenant: '001' }, JWT_SECRET, { expiresIn: '-1s' });
    const req = mockReq(token) as Request;

    requireTenant(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token has no tenant claim', () => {
    const token = makeToken({ user: 'admin' }); // no tenant field
    const req = mockReq(token) as Request;

    requireTenant(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test tests/unit/middleware/auth.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/middleware/auth'`

- [ ] **Step 3: Create `src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export class AuthError extends Error {}

// Extend Express Request to carry tenant slug
declare global {
  namespace Express {
    interface Request {
      tenant: string;
    }
  }
}

interface TokenPayload {
  tenant: string;
  iat: number;
  exp: number;
}

export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

    if (!payload.tenant || typeof payload.tenant !== 'string') {
      res.status(401).json({ error: 'Token missing tenant claim' });
      return;
    }

    req.tenant = payload.tenant;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm test tests/unit/middleware/auth.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/middleware/auth.ts tests/unit/middleware/auth.test.ts
git commit -m "feat: add JWT auth middleware with tenant injection"
```

---

## Task 7: Express App + Health Route

**Files:**
- Create: `src/app.ts`
- Create: `src/index.ts`
- Create: `src/routes/health.ts`
- Create: `tests/integration/routes/health.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/integration/routes/health.test.ts
import request from 'supertest';
import { createApp } from '../../../src/app';

describe('GET /health', () => {
  const app = createApp();

  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('includes environment in response', async () => {
    const res = await request(app).get('/health');
    expect(res.body.env).toBe('test');
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test tests/integration/routes/health.test.ts
```

Expected: FAIL — `Cannot find module '../../../src/app'`

- [ ] **Step 3: Create `src/routes/health.ts`**

```typescript
import { Router } from 'express';
import { config } from '../config/env';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() });
});

export default router;
```

- [ ] **Step 4: Create `src/app.ts`**

```typescript
import express from 'express';
import healthRouter from './routes/health';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use(healthRouter);

  return app;
}
```

- [ ] **Step 5: Create `src/index.ts`**

```typescript
import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Novo Food API listening on port ${config.port} [${config.env}]`);
});
```

- [ ] **Step 6: Run test — verify it passes**

```bash
npm test tests/integration/routes/health.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 7: Smoke test the server**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/health
```

Expected: `{"status":"ok","env":"development","timestamp":"..."}`

- [ ] **Step 8: Commit**

```bash
git add src/app.ts src/index.ts src/routes/health.ts tests/integration/routes/health.test.ts
git commit -m "feat: add Express app factory and /health route"
```

---

## Task 8: WhatsApp Webhook Route

**Files:**
- Create: `src/routes/whatsapp.ts`
- Create: `tests/integration/routes/whatsapp.test.ts`

In F1 this route: (1) verifies the Meta hub challenge, (2) receives messages, (3) logs them, and (4) returns 200. No LLM call yet.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/integration/routes/whatsapp.test.ts
import request from 'supertest';
import { createApp } from '../../../src/app';

describe('WhatsApp webhook', () => {
  const app = createApp();

  describe('GET /webhooks/whatsapp (Meta verification)', () => {
    beforeAll(() => {
      process.env.META_VERIFY_TOKEN = 'test-verify-token';
    });

    it('returns challenge when hub.verify_token matches', async () => {
      const res = await request(app)
        .get('/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test-verify-token',
          'hub.challenge': 'CHALLENGE_CODE_123',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('CHALLENGE_CODE_123');
    });

    it('returns 403 when verify_token does not match', async () => {
      const res = await request(app)
        .get('/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'CHALLENGE_CODE_123',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /webhooks/whatsapp (incoming message)', () => {
    it('returns 200 for valid WhatsApp message payload', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'ENTRY_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              messages: [{
                from: '+34600000000',
                text: { body: 'Hola, quiero pedir una burger' },
                type: 'text',
                timestamp: '1234567890',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const res = await request(app).post('/webhooks/whatsapp').send(payload);
      expect(res.status).toBe(200);
    });

    it('returns 200 for non-message events (status updates)', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{ id: 'ENTRY_ID', changes: [{ value: { statuses: [] }, field: 'messages' }] }],
      };

      const res = await request(app).post('/webhooks/whatsapp').send(payload);
      expect(res.status).toBe(200);
    });
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test tests/integration/routes/whatsapp.test.ts
```

Expected: FAIL — routes not registered

- [ ] **Step 3: Create `src/routes/whatsapp.ts`**

```typescript
import { Router } from 'express';
import { config } from '../config/env';

const router = Router();

// Extracted text from a WhatsApp message payload
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

  // Always respond 200 quickly (Meta requires <20s)
  res.status(200).json({ received: true });

  // Process asynchronously — do not await in the route handler
  processWhatsAppEvent(body).catch((err: Error) => {
    console.error('[whatsapp] Processing error:', err.message);
  });
});

async function processWhatsAppEvent(body: Record<string, unknown>): Promise<void> {
  const entries = (body.entry as Array<Record<string, unknown>>) ?? [];

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      const value = change.value as Record<string, unknown>;
      const messages = (value.messages as WhatsAppMessage[]) ?? [];

      for (const message of messages) {
        if (message.type === 'text' && message.text) {
          // F1: Log only. F2 will route to LLM.
          console.log(`[whatsapp] from=${message.from} text="${message.text.body}"`);
        }
      }
    }
  }
}

export default router;
```

- [ ] **Step 4: Register route in `src/app.ts`**

```typescript
import express from 'express';
import healthRouter from './routes/health';
import whatsappRouter from './routes/whatsapp';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use(healthRouter);
  app.use(whatsappRouter);

  return app;
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
npm test tests/integration/routes/whatsapp.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/routes/whatsapp.ts src/app.ts tests/integration/routes/whatsapp.test.ts
git commit -m "feat: add WhatsApp webhook receiver (F1 - log only)"
```

---

## Task 9: Twilio Voice WebSocket + Deepgram STT

**Files:**
- Create: `src/routes/voice.ts`

This is the audio pipeline: Twilio streams raw audio over WebSocket → Deepgram STT transcribes it → transcript logged to console. F2 will route the transcript to the LLM.

No integration test for the WebSocket in F1 (requires live audio stream). Manual test with Twilio CLI.

- [ ] **Step 1: Create `src/routes/voice.ts`**

```typescript
import { Router } from 'express';
import expressWs from 'express-ws';
import { createClient as createDeepgramClient } from '@deepgram/sdk';
import { config } from '../config/env';
import type { WebSocket } from 'ws';

const router = Router();

// Twilio sends audio as base64-encoded mulaw 8kHz chunks
// Deepgram receives them and returns transcripts in real time

router.ws('/voice/:restaurantSlug', (ws: WebSocket, req) => {
  const { restaurantSlug } = req.params;
  console.log(`[voice] New call for tenant: ${restaurantSlug}`);

  const deepgram = createDeepgramClient(config.deepgram.apiKey);

  // Open a live transcription session
  const dgLive = deepgram.listen.live({
    model: 'nova-2',
    language: 'es',
    encoding: 'mulaw',
    sample_rate: 8000,
    channels: 1,
    endpointing: 300,         // ms of silence before endpoint
    utterance_end_ms: 1000,   // emit UtteranceEnd after 1s silence
    interim_results: false,   // only final transcripts
  });

  dgLive.on('open', () => {
    console.log(`[voice][${restaurantSlug}] Deepgram connection opened`);
  });

  dgLive.on('transcript', (data) => {
    const transcript = data?.channel?.alternatives?.[0]?.transcript ?? '';
    if (transcript.trim()) {
      // F1: Log only. F2 will pass this to LLM.
      console.log(`[voice][${restaurantSlug}] Transcript: "${transcript}"`);
    }
  });

  dgLive.on('error', (err: Error) => {
    console.error(`[voice][${restaurantSlug}] Deepgram error:`, err.message);
  });

  // Twilio sends JSON-encoded media stream events
  ws.on('message', (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString()) as { event: string; media?: { payload: string } };

      if (msg.event === 'media' && msg.media?.payload) {
        // Twilio sends audio as base64 mulaw — send raw buffer to Deepgram
        const audioBuffer = Buffer.from(msg.media.payload, 'base64');
        dgLive.send(audioBuffer);
      } else if (msg.event === 'stop') {
        console.log(`[voice][${restaurantSlug}] Call ended`);
        dgLive.finish();
      }
    } catch {
      // Malformed message — ignore
    }
  });

  ws.on('close', () => {
    dgLive.finish();
    console.log(`[voice][${restaurantSlug}] WebSocket closed`);
  });
});

export { router as voiceRouter };
export function applyVoiceRoutes(app: ReturnType<typeof expressWs>['app']) {
  app.use(router);
}
```

- [ ] **Step 2: Update `src/app.ts` to enable WebSockets and register voice route**

```typescript
import express from 'express';
import expressWs from 'express-ws';
import healthRouter from './routes/health';
import whatsappRouter from './routes/whatsapp';
import { applyVoiceRoutes } from './routes/voice';

export function createApp() {
  const app = express();
  const { app: wsApp } = expressWs(app);

  wsApp.use(express.json());
  wsApp.use(healthRouter);
  wsApp.use(whatsappRouter);
  applyVoiceRoutes(wsApp);

  return wsApp;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Configure Twilio to stream to this endpoint**

In Twilio Console → Phone Numbers → your SIP number → Voice Configuration:

Set "A call comes in" → Webhook → `https://your-ngrok-url.ngrok.io/voice/001`

Or with Twilio CLI (local dev):
```bash
ngrok http 3000
# copy the https URL, then:
twilio phone-numbers:update +1XXXXXXXXXX \
  --voice-url="https://YOUR_NGROK.ngrok.io/twiml/voice/001"
```

For Twilio to stream audio to WebSocket, you also need a TwiML endpoint that returns a `<Stream>` verb. Create `src/routes/twiml.ts`:

```typescript
import { Router } from 'express';

const router = Router();

router.post('/twiml/voice/:restaurantSlug', (req, res) => {
  const { restaurantSlug } = req.params;
  const wsUrl = `wss://${req.headers.host}/voice/${restaurantSlug}`;

  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`);
});

export default router;
```

Add to `src/app.ts`:
```typescript
import twimlRouter from './routes/twiml';
// ...
wsApp.use(twimlRouter);
```

Set Twilio webhook to `POST https://YOUR_NGROK.ngrok.io/twiml/voice/001`

- [ ] **Step 5: Manual end-to-end test**

```bash
npm run dev
# In another terminal:
ngrok http 3000
# Set Twilio webhook to https://<ngrok>.ngrok.io/twiml/voice/001
# Call your Twilio number and speak
```

Expected server logs:
```
[voice] New call for tenant: 001
[voice][001] Deepgram connection opened
[voice][001] Transcript: "hola quiero pedir una burger clásica"
[voice][001] Call ended
```

- [ ] **Step 6: Commit**

```bash
git add src/routes/voice.ts src/routes/twiml.ts src/app.ts
git commit -m "feat: add Twilio voice WebSocket with Deepgram STT (F1 - transcript log)"
```

---

## Task 10: Order Insert Integration Test

**Files:**
- Create: `tests/integration/db/orderInsert.test.ts`

This test validates that the Supabase tenant client can insert and retrieve an Order from `restaurant_001`. **Requires a real Supabase project** with migrations already run (Task 4). Skip in CI until Supabase test env is configured.

- [ ] **Step 1: Write the test**

```typescript
// tests/integration/db/orderInsert.test.ts
// @jest-environment node
// NOTE: Requires SUPABASE_URL + SUPABASE_SERVICE_KEY pointing to a real project

import { getTenantClient } from '../../../src/db/tenantClient';
import type { Order } from '../../../src/types/order';

const SKIP = !process.env.SUPABASE_URL?.includes('supabase.co');

(SKIP ? describe.skip : describe)('Order insert/select (real Supabase)', () => {
  const db = getTenantClient('001');

  const testOrder = {
    session_id: '00000000-0000-0000-0000-000000000001',
    channel: 'whatsapp' as const,
    items: [{ product_id: 'test-pid', name: 'Test Burger', quantity: 1, modifications: [], unit_price: 10, subtotal: 10 }],
    summary: { subtotal: 10, discount: 0, tax_rate: 0.21, tax: 2.1, delivery_fee: 0, total: 12.1 },
    delivery: { type: 'takeaway' as const },
    payment: { status: 'pending' as const },
    status: 'pending' as const,
  };

  let insertedId: string;

  it('inserts an order', async () => {
    const { data, error } = await db.from('orders').insert(testOrder).select('id').single();
    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    insertedId = data!.id;
  });

  it('reads back the order by id', async () => {
    const { data, error } = await db.from('orders').select('*').eq('id', insertedId).single();
    expect(error).toBeNull();
    expect(data?.channel).toBe('whatsapp');
    expect(data?.status).toBe('pending');
  });

  afterAll(async () => {
    // Cleanup test data
    if (insertedId) {
      await db.from('orders').delete().eq('id', insertedId);
    }
  });
});
```

- [ ] **Step 2: Run test (with real Supabase)**

```bash
npm run test:integration
```

Expected: PASS (skipped if Supabase URL is a test placeholder, PASS if real URL)

- [ ] **Step 3: Commit**

```bash
git add tests/integration/db/orderInsert.test.ts
git commit -m "test: add Supabase order insert/select integration test"
```

---

## Task 11: Docker Compose

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

- [ ] **Step 1: Create `Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      target: dev
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    volumes:
      - ./src:/app/src
      - ./tests:/app/tests
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --save 60 1
    restart: unless-stopped
```

- [ ] **Step 3: Create `.dockerignore`**

```
node_modules
dist
.env.local
*.log
.git
```

- [ ] **Step 4: Test Docker Compose**

```bash
# Copy .env.example → .env.local and fill in real values first
cp .env.example .env.local
docker compose up --build
```

Expected: API listening on port 3000, Redis running.

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","env":"development",...}`

- [ ] **Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "chore: add Docker Compose for local development"
```

---

## Task 12: F1 Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All unit + integration tests pass. Coverage ≥ 70%.

- [ ] **Step 2: Verify F1 success criteria**

| Criterion | How to verify |
|-----------|--------------|
| `npm run dev` starts without errors | Run it, look for "listening on port 3000" |
| `POST /webhooks/whatsapp` receives + logs | Send test payload via curl or Postman |
| Calling Twilio number → audio → Deepgram text | Manual call while watching logs |
| Insert + read Order in Supabase `restaurant_001` | Run integration test with real Supabase |
| Docker Compose stack up | `docker compose up`, `curl /health` |

- [ ] **Step 3: Tag the release**

```bash
git tag f1-complete
git push origin main --tags
```

---

## Self-Review

**Spec coverage check:**
- ✅ API Gateway (Node.js + TypeScript Express) — Tasks 7–8
- ✅ Multi-tenancy schema-level — Tasks 4–5
- ✅ Auth middleware (JWT + tenant) — Task 6
- ✅ WhatsApp webhook receiver — Task 8
- ✅ Twilio SIP + Deepgram STT pipeline — Task 9
- ✅ Order insert/read Supabase — Task 10
- ✅ Docker Compose — Task 11
- ✅ Environment validation — Task 2
- ✅ TypeScript types (Order contract) — Task 3

**Deferred to F2 (by design):**
- LLM (Claude) integration — F2
- ElevenLabs TTS — F2
- Full order flow (voice → confirm → kitchen) — F2
- Session Manager (Redis) — F2

**Type consistency check:**
- `Order`, `OrderItem`, `OrderDelivery`, `OrderSummary`, `OrderPayment` defined once in `src/types/order.ts` and referenced consistently
- `getTenantClient(slug: string): SupabaseClient` — used in Task 10 test exactly as defined in Task 5
- `requireTenant` middleware attaches `req.tenant: string` — matches `getTenantClient(req.tenant)` call pattern for F2

**No placeholders detected.** All steps contain actual code or exact commands.
