// tests/integration/routes/health.test.ts
import request from 'supertest';
import { createApp } from '../../../src/app';

describe('GET /health', () => {
  const app = createApp();

  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('includes environment in response', async () => {
    const res = await request(app).get('/health');
    expect(res.body.env).toBe('test');
  });
});
