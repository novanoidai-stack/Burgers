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
