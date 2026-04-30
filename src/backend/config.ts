import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

export interface Config {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappWebhookToken?: string;
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || '';
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ? parseInt(value, 10) : (defaultValue || 0);
}

export const config: Config = {
  port: getEnvNumber('PORT', 3001),
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  logLevel: getEnv('LOG_LEVEL', 'info'),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  whatsappWebhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN,
};
