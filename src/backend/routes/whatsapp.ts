import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger';
import {
  verifyWebhook,
  parseWebhookMessage,
  sendWhatsAppMessage,
} from '../services/whatsapp';

const whatsappRouter = Router();

// GET /webhooks/whatsapp — Meta verification
whatsappRouter.get('/webhooks/whatsapp', (req: Request, res: Response) => {
  try {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    logger.info('Webhook verification request', { mode, token: token ? '***' : 'missing' });

    const result = verifyWebhook(mode, token, challenge);
    if (!result) {
      res.status(403).send('Forbidden');
      return;
    }

    res.status(200).send(challenge);
  } catch (error) {
    logger.error('Error in webhook GET', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /webhooks/whatsapp — Receive messages
whatsappRouter.post('/webhooks/whatsapp', async (req: Request, res: Response) => {
  try {
    // Always respond 200 immediately (Meta requires fast response)
    res.status(200).json({ received: true });

    // Parse message asynchronously
    const parsed = parseWebhookMessage(req.body);
    if (!parsed) {
      logger.debug('Invalid or empty webhook payload');
      return;
    }

    // Send echo response
    const echoMessage = `Recibido: ${parsed.text}`;
    await sendWhatsAppMessage(parsed.from, echoMessage);
  } catch (error) {
    logger.error('Error processing webhook POST', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Response already sent with 200
  }
});

export { whatsappRouter };
