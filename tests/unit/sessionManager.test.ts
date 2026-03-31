import { buildEmptyOrderDraft } from '../../src/services/sessionManager';

describe('SessionManager', () => {
  describe('buildEmptyOrderDraft', () => {
    it('returns empty draft in taking_order status', () => {
      const draft = buildEmptyOrderDraft();
      expect(draft).toEqual({ items: [], status: 'taking_order' });
    });
  });

  describe('createSession (unit — validates args)', () => {
    it('throws if tenantSlug is empty', async () => {
      const { createSession } = await import('../../src/services/sessionManager');
      await expect(createSession('', 'voice', '+34600000001')).rejects.toThrow('tenantSlug required');
    });
  });
});
