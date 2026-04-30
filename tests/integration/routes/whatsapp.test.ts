// tests/integration/routes/whatsapp.test.ts
import request from 'supertest';
import { createApp } from '../../../src/app';

describe('WhatsApp webhook', () => {
  const app = createApp();

  describe('GET /webhooks/whatsapp (Meta verification)', () => {
    beforeAll(() => {
      process.env.META_VERIFY_TOKEN = 'test-verify-token';
    });

    it('returns challenge when hub.verify_token matches', async () => {
      const res = await request(app)
        .get('/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test-verify-token',
          'hub.challenge': 'CHALLENGE_CODE_123',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('CHALLENGE_CODE_123');
    });

    it('returns 403 when verify_token does not match', async () => {
      const res = await request(app)
        .get('/webhooks/whatsapp')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'CHALLENGE_CODE_123',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /webhooks/whatsapp (incoming message)', () => {
    it('returns 200 for valid WhatsApp message payload', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'ENTRY_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              messages: [{
                from: '+34600000000',
                text: { body: 'Hola, quiero pedir una burger' },
                type: 'text',
                timestamp: '1234567890',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const res = await request(app).post('/webhooks/whatsapp').send(payload);
      expect(res.status).toBe(200);
    });

    it('returns 200 for non-message events (status updates)', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{ id: 'ENTRY_ID', changes: [{ value: { statuses: [] }, field: 'messages' }] }],
      };

      const res = await request(app).post('/webhooks/whatsapp').send(payload);
      expect(res.status).toBe(200);
    });
  });
});
