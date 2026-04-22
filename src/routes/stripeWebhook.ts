import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '../services/paymentService';
import { updateSession } from '../services/sessionManager';
import { config } from '../config/env';

const router = Router();

router.post('/webhooks/stripe', (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event;
  try {
    event = verifyWebhookSignature(req.body as Buffer, sig);
  } catch (err) {
    console.error('[stripe] Webhook signature invalid:', (err as Error).message);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  res.status(200).json({ received: true });

  handleStripeEvent(event).catch(err => {
    console.error('[stripe] Event processing error:', (err as Error).message);
  });
});

async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type !== 'checkout.session.completed') return;

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};

  if (!metadata.session_id || !metadata.tenant_slug) {
    console.error('[stripe] Missing metadata in checkout session');
    return;
  }

  const { session_id, tenant_slug } = metadata;
  console.log(`[stripe] Payment confirmed for session ${session_id} (tenant: ${tenant_slug})`);

  await updateSession(tenant_slug, session_id, {
    status: 'paid',
    stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
  });

  const orderId = metadata.order_id;
  if (orderId) {
    const client = createClient(config.supabase.url, config.supabase.serviceKey);
    const db = client.schema(`restaurant_${tenant_slug}`);
    await (db as any)
      .from('orders')
      .update({
        status: 'paid',
        payment: {
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        },
      })
      .eq('id', orderId);
  }
}

export default router;
