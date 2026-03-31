import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

export class TenantClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantClientError';
  }
}

// Lowercase alphanumeric and underscores only — matches valid unquoted PostgreSQL identifiers
const VALID_SLUG = /^[a-z0-9_]+$/;

/**
 * Returns a Supabase client scoped to restaurant_{slug} schema.
 * All queries from this client are isolated to that tenant's data.
 */
export function getTenantClient(slug: string): ReturnType<typeof createClient<any, string, string>> {
  if (!slug || !VALID_SLUG.test(slug)) {
    throw new TenantClientError(`Invalid tenant slug: "${slug}"`);
  }

  return createClient<any, string, string>(config.supabase.url, config.supabase.serviceKey, {
    db: { schema: `restaurant_${slug}` },
  });
}
