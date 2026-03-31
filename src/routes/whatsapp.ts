import { Router } from 'express';
import { config } from '../config/env';

const router = Router();

// Extracted text from a WhatsApp message payload
interface WhatsAppMessage {
  from: string;
  text?: { body: string };
  type: string;
  timestamp: string;
}

// Meta webhook verification (GET)
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

// Incoming messages (POST)
router.post('/webhooks/whatsapp', (req, res) => {
  const body = req.body;

  // Always respond 200 quickly (Meta requires <20s)
  res.status(200).json({ received: true });

  // Process asynchronously — do not await in the route handler
  processWhatsAppEvent(body).catch((err: Error) => {
    console.error('[whatsapp] Processing error:', err.message);
  });
});

async function processWhatsAppEvent(body: Record<string, unknown>): Promise<void> {
  const entries = (body.entry as Array<Record<string, unknown>>) ?? [];

  for (const entry of entries) {
    const changes = (entry.changes as Array<Record<string, unknown>>) ?? [];
    for (const change of changes) {
      const value = change.value as Record<string, unknown>;
      const messages = (value.messages as WhatsAppMessage[]) ?? [];

      for (const message of messages) {
        if (message.type === 'text' && message.text) {
          // F1: Log only. F2 will route to LLM.
          console.log(`[whatsapp] from=${message.from} text="${message.text.body}"`);
        }
      }
    }
  }
}

export default router;
