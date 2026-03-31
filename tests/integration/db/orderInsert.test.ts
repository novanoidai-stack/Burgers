// tests/integration/db/orderInsert.test.ts
// @jest-environment node
// NOTE: Requires SUPABASE_URL + SUPABASE_SERVICE_KEY pointing to a real project

import { getTenantClient } from '../../../src/db/tenantClient';

// Skip unless SUPABASE_URL points to a real project (not the test placeholder)
const url = process.env.SUPABASE_URL ?? '';
const SKIP = !url.match(/^https:\/\/(?!test\.)[a-z0-9-]+\.supabase\.co/);

(SKIP ? describe.skip : describe)('Order insert/select (real Supabase)', () => {
  const db = getTenantClient('001');

  const testOrder = {
    session_id: '00000000-0000-0000-0000-000000000001',
    channel: 'whatsapp' as const,
    items: [
      {
        product_id: 'test-pid',
        name: 'Test Burger',
        quantity: 1,
        modifications: [],
        unit_price: 10,
        subtotal: 10,
      },
    ],
    summary: {
      subtotal: 10,
      discount: 0,
      tax_rate: 0.21,
      tax: 2.1,
      delivery_fee: 0,
      total: 12.1,
    },
    delivery: { type: 'takeaway' as const },
    payment: { status: 'pending' as const },
    status: 'pending' as const,
  };

  let insertedId: string;

  it('inserts an order', async () => {
    const { data, error } = await db.from('orders').insert(testOrder).select('id').single();
    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    insertedId = data!.id;
  });

  it('reads back the order by id', async () => {
    const { data, error } = await db.from('orders').select('*').eq('id', insertedId).single();
    expect(error).toBeNull();
    expect(data?.channel).toBe('whatsapp');
    expect(data?.status).toBe('pending');
  });

  afterAll(async () => {
    // Cleanup test data
    if (insertedId) {
      await db.from('orders').delete().eq('id', insertedId);
    }
  });
});
