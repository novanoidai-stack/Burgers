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
