-- Run this PER TENANT, replacing schema_name with the tenant slug (e.g. 'restaurant_001')
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
