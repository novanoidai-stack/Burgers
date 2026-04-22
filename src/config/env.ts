// Validates process.env at startup. Import `config` in application code; call `loadConfig()` in tests.
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

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
  JWT_SECRET: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Meta / WhatsApp
  META_ACCESS_TOKEN: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
  // Stripe
  STRIPE_API_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Retell AI (Voice)
  RETELL_API_KEY: z.string().optional(),
});

export type Config = {
  supabase: { url: string; anonKey: string; serviceKey: string };
  jwt: { secret: string };
  port: number;
  env: 'development' | 'test' | 'production';
  anthropic: { apiKey: string };
  meta: { accessToken?: string; verifyToken?: string };
  stripe: { apiKey?: string; webhookSecret?: string };
  retell: { apiKey?: string };
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
    anthropic: { apiKey: e.ANTHROPIC_API_KEY },
    meta: { accessToken: e.META_ACCESS_TOKEN, verifyToken: e.META_VERIFY_TOKEN },
    stripe: { apiKey: e.STRIPE_API_KEY, webhookSecret: e.STRIPE_WEBHOOK_SECRET },
    retell: { apiKey: e.RETELL_API_KEY },
  };
}

// Singleton — loaded once at startup, throws if env is broken
export const config = loadConfig();
