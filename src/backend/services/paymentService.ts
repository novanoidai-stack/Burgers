import Stripe from 'stripe';
import { config } from '../config/env';
import { DraftItem } from '../types/conversation';

function getStripeClient(): Stripe {
  const key = config.stripe.secretKey;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

export function calculateTotal(items: DraftItem[]): number {
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
}

export function buildStripeMetadata(
  orderId: string,
  tenantSlug: string,
  sessionId: string,
): Record<string, string> {
  return { order_id: orderId, tenant_slug: tenantSlug, session_id: sessionId };
}

export async function createPaymentLink(
  orderId: string,
  tenantSlug: string,
  sessionId: string,
  items: DraftItem[],
  restaurantName = 'El Mesón',
): Promise<string> {
  const stripe = getStripeClient();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: item.modifiers.length > 0 ? item.modifiers.join(', ') : undefined,
          },
          unit_amount: Math.round(item.unit_price * 100),
        },
        quantity: item.quantity,
      })),
      metadata: buildStripeMetadata(orderId, tenantSlug, sessionId),
      expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
      success_url: `${config.baseUrl ?? 'https://example.com'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl ?? 'https://example.com'}/payment/cancel`,
    });

    if (!session.url) throw new Error('Stripe session has no URL');
    return session.url;
  } catch (err) {
    console.error('[paymentService] Stripe checkout error:', (err as Error).message);
    // Distinguish retryable errors (timeout, rate limit) vs permanent errors
    if (err instanceof stripe.errors.StripeAPIError) {
      const { code, type } = err;
      if (code === 'timeout' || code === 'rate_limit') {
        console.warn('[paymentService] Retryable error, should retry:', code);
        // Could implement retry logic here in F3
      }
    }
    throw err;
  }
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
  const webhookSecret = config.stripe.webhookSecret;
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
