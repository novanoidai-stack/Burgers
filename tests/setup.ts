// Inject test env vars before any module loads.
// Real credentials (e.g. from .env.local) are preserved if already set.
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL ??= 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY ??= 'test-service-key';
process.env.JWT_SECRET ??= 'test-jwt-secret-32-chars-minimum!!';
process.env.DEEPGRAM_API_KEY ??= 'test-deepgram-key';
process.env.META_VERIFY_TOKEN ??= 'test-verify-token';
