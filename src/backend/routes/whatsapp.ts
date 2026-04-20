import { Router } from 'express';
import { config } from '../config/env';
import { normalizeWhatsAppInput } from '../services/inputNormalizer';
import { getOrCreateSessionByPhone, updateSession } from '../services/sessionManager';
import { processMessage } from '../services/llmOrchestrator';
import { sendWhatsAppText } from '../services/outputRouter';
import { createPaymentLink } from '../services/paymentService';

const router = Router();

interface WhatsAppMessage {
  from: string;
  text?: { body: string };
  type: string;
  timestamp: string;
}

router.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.meta.verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

router.post('/webhooks/whatsapp', (req, res) => {
  const body = req.body;
  res.status(200).json({ received: true });
  processWhatsAppEvent(body, '001').catch((err: Error) => {
    console.error('[whatsapp] Processing error:', err.message);
  });
});

async function processWhatsAppEvent(body: Record<string, unknown>, tenantSlug: string): Promise<void> {
  const entries = (body.entry as Array<Record<string, unknown>>) ?? [];

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      const value = change.value as Record<string, unknown>;
      const messages = (value.messages as WhatsAppMessage[]) ?? [];

      for (const message of messages) {
        if (message.type !== 'text' || !message.text) continue;

        const input = normalizeWhatsAppInput(tenantSlug, message.from, message.text.body);
        if (!input) continue;

        try {
          const session = await getOrCreateSessionByPhone(tenantSlug, message.from, 'whatsapp');
          const llmResponse = await processMessage(input, session);

          await updateSession(tenantSlug, session.id, llmResponse.sessionUpdate);

          // Use updated draft from this turn (items may have been added in same message as confirm)
          const currentItems = llmResponse.sessionUpdate.order_draft?.items ?? session.order_draft.items;
          if (llmResponse.triggerPayment && currentItems.length > 0) {
            try {
              const paymentUrl = await createPaymentLink(
                session.id,
                tenantSlug,
                session.id,
                currentItems,
              );
              await updateSession(tenantSlug, session.id, {
                stripe_payment_link: paymentUrl,
                status: 'awaiting_payment',
              });
              await sendWhatsAppText(message.from, `${llmResponse.reply}\n\n💳 Paga aquí: ${paymentUrl}`);
            } catch (err) {
              console.error('[whatsapp] Stripe error:', (err as Error).message);
              await sendWhatsAppText(message.from, 'Hubo un problema al generar el link de pago. Por favor inténtalo de nuevo.');
            }
            continue;
          }

          await sendWhatsAppText(message.from, llmResponse.reply);
        } catch (err) {
          console.error(`[whatsapp] Pipeline error for ${message.from}:`, (err as Error).message);
        }
      }
    }
  }
}

export default router;
