// tests/unit/config/env.test.ts
import { loadConfig, ConfigError } from '../../../src/config/env';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns typed config when all required vars present', () => {
    process.env.SUPABASE_URL = 'https://abc.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_KEY = 'service-key';
    process.env.JWT_SECRET = 'a-secret-that-is-32-chars-minimum!';
    process.env.DEEPGRAM_API_KEY = 'dg-key';

    const config = loadConfig();

    expect(config.supabase.url).toBe('https://abc.supabase.co');
    expect(config.jwt.secret).toBe('a-secret-that-is-32-chars-minimum!');
    expect(config.port).toBe(3000);
  });

  it('throws ConfigError when SUPABASE_URL is missing', () => {
    // Set all required vars explicitly, then remove the one we're testing
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_KEY = 'service-key';
    process.env.JWT_SECRET = 'a-secret-that-is-32-chars-minimum!';
    process.env.DEEPGRAM_API_KEY = 'dg-key';
    delete process.env.SUPABASE_URL;

    expect(() => loadConfig()).toThrow(ConfigError);
  });

  it('uses PORT env var when set', () => {
    process.env.SUPABASE_URL = 'https://abc.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_KEY = 'service-key';
    process.env.JWT_SECRET = 'a-secret-that-is-32-chars-minimum!';
    process.env.DEEPGRAM_API_KEY = 'dg-key';
    process.env.PORT = '4000';

    const config = loadConfig();
    expect(config.port).toBe(4000);
  });
});
