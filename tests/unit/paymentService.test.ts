import { buildStripeMetadata, calculateTotal } from '../../src/services/paymentService';
import { DraftItem } from '../../src/types/conversation';

describe('PaymentService', () => {
  describe('calculateTotal', () => {
    it('sums items correctly', () => {
      const items: DraftItem[] = [
        { product_id: 'p1', name: 'Super Smash Bros', quantity: 2, unit_price: 10, modifiers: [] },
        { product_id: 'p2', name: 'Patatas Fritas', quantity: 1, unit_price: 6, modifiers: [] },
      ];
      expect(calculateTotal(items)).toBe(26);
    });

    it('returns 0 for empty items', () => {
      expect(calculateTotal([])).toBe(0);
    });
  });

  describe('buildStripeMetadata', () => {
    it('includes order_id, tenant_slug and session_id', () => {
      const meta = buildStripeMetadata('order-123', '001', 'session-abc');
      expect(meta).toEqual({ order_id: 'order-123', tenant_slug: '001', session_id: 'session-abc' });
    });
  });
});
