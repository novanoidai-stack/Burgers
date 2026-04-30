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
    expect(client.__url).toBe(process.env.SUPABASE_URL);
    expect(client.__key).toBe(process.env.SUPABASE_SERVICE_KEY);
    expect(client.__options).toMatchObject({ db: { schema: 'restaurant_001' } });
  });

  it('throws TenantClientError for invalid slug (contains special chars)', () => {
    expect(() => getTenantClient('001; DROP TABLE--')).toThrow(TenantClientError);
  });

  it('throws TenantClientError for empty slug', () => {
    expect(() => getTenantClient('')).toThrow(TenantClientError);
  });
});
