import { buildSystemPrompt, applyToolCall } from '../../src/services/llmOrchestrator';
import { ProductRow, SessionRow } from '../../src/types/conversation';
import { buildEmptyOrderDraft } from '../../src/services/sessionManager';

const mockProducts: ProductRow[] = [
  { id: 'p1', name: 'Super Smash Bros', price: 10, category: 'burger', description: 'Deliciosa', is_available: true, allowed_modifications: ['sin pepinillos'] },
  { id: 'p2', name: 'Patatas Fritas', price: 6, category: 'racion', description: 'Crujientes', is_available: true, allowed_modifications: [] },
];

function makeSession(): SessionRow {
  return {
    id: 's1', customer_id: null, channel: 'voice',
    order_draft: buildEmptyOrderDraft(),
    llm_history: [], status: 'taking_order',
    phone_number: null, stripe_payment_link: null,
    stripe_payment_intent_id: null, order_id: null,
    created_at: '', last_activity: '',
  };
}

describe('LLMOrchestrator', () => {
  describe('buildSystemPrompt', () => {
    it('includes restaurant name', () => {
      const prompt = buildSystemPrompt('El Mesón', mockProducts);
      expect(prompt).toContain('El Mesón');
    });

    it('includes menu items with prices', () => {
      const prompt = buildSystemPrompt('El Mesón', mockProducts);
      expect(prompt).toContain('Super Smash Bros');
      expect(prompt).toContain('10.00€');
      expect(prompt).toContain('Patatas Fritas');
    });

    it('includes guardrail rule', () => {
      const prompt = buildSystemPrompt('El Mesón', mockProducts);
      expect(prompt).toContain('Solo puedes ofrecer productos del menú');
    });
  });

  describe('applyToolCall', () => {
    it('add_item adds item to order draft', () => {
      const session = makeSession();
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'add_item', arguments: JSON.stringify({ product_id: 'p1', quantity: 2, name: 'Super Smash Bros', unit_price: 10, modifiers: [] }) } },
        session,
        mockProducts,
      );
      expect(result.orderUpdate.items).toHaveLength(1);
      expect(result.orderUpdate.items![0].quantity).toBe(2);
      expect(result.toolResult).toContain('añadido');
    });

    it('add_item increments quantity for existing item', () => {
      const session = makeSession();
      session.order_draft.items = [{ product_id: 'p1', name: 'Super Smash Bros', quantity: 1, unit_price: 10, modifiers: [] }];
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'add_item', arguments: JSON.stringify({ product_id: 'p1', quantity: 1, name: 'Super Smash Bros', unit_price: 10, modifiers: [] }) } },
        session,
        mockProducts,
      );
      expect(result.orderUpdate.items![0].quantity).toBe(2);
    });

    it('remove_item removes item from order draft', () => {
      const session = makeSession();
      session.order_draft.items = [{ product_id: 'p1', name: 'Super Smash Bros', quantity: 1, unit_price: 10, modifiers: [] }];
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'remove_item', arguments: JSON.stringify({ product_id: 'p1' }) } },
        session,
        mockProducts,
      );
      expect(result.orderUpdate.items).toHaveLength(0);
    });

    it('confirm_order sets triggerPayment to true', () => {
      const session = makeSession();
      session.order_draft.items = [{ product_id: 'p1', name: 'Super Smash Bros', quantity: 1, unit_price: 10, modifiers: [] }];
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'confirm_order', arguments: '{}' } },
        session,
        mockProducts,
      );
      expect(result.triggerPayment).toBe(true);
    });

    it('get_order_summary returns total price', () => {
      const session = makeSession();
      session.order_draft.items = [
        { product_id: 'p1', name: 'Super Smash Bros', quantity: 2, unit_price: 10, modifiers: [] },
      ];
      const result = applyToolCall(
        { id: 't1', type: 'function', function: { name: 'get_order_summary', arguments: '{}' } },
        session,
        mockProducts,
      );
      expect(result.toolResult).toContain('20.00€');
    });
  });
});
