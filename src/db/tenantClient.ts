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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient(config.supabase.url, config.supabase.serviceKey, {
    db: { schema: `restaurant_${slug}` },
  }) as unknown as SupabaseClient;
}
