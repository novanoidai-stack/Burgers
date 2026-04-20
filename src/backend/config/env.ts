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

// Singleton — loaded once at startup, throws if env is broken
export const config = loadConfig();
