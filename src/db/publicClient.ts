import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Client for the `public` schema (tenants, users, billing)
export const publicClient = createClient(config.supabase.url, config.supabase.serviceKey);
