import { Router, Request, Response } from 'express';
import { logger } from '../middleware/logger';
import {
  verifyWebhook,
  parseWebhookMessage,
  sendWhatsAppMessage,
} from '../services/whatsapp';
import { processWithLLM, formatMenuForDisplay } from '../services/llm';
import {
  findOrCreateUser,
  getMenuItems,
  createOrder,
  saveConversation,
  getConversation,
} from '../services/supabase';
import { ConversationMessage } from '../types';

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

    // Process message with LLM in background
    try {
      // Find or create user
      const user = await findOrCreateUser(parsed.from);

      // Get menu items
      const menuItems = await getMenuItems();

      // Get conversation history
      const history = await getConversation(parsed.from);
      const conversationHistory = history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Process with LLM
      const llmResponse = await processWithLLM(parsed.text, conversationHistory, menuItems);

      // Determine response message
      let responseMessage = llmResponse.response_message;
      if (llmResponse.action === 'show_menu') {
        responseMessage = formatMenuForDisplay(menuItems);
      }

      // Create order if needed
      if (llmResponse.action === 'create_order' && llmResponse.order) {
        const order = await createOrder(
          user.id,
          llmResponse.order.items,
          llmResponse.order.total,
          'whatsapp',
        );
        responseMessage += `\n\n✅ Pedido #${order.id.substring(0, 8)} creado`;
      }

      // Save conversation
      const messages: ConversationMessage[] = [
        ...history,
        { role: 'user', content: parsed.text, timestamp: new Date().toISOString() },
        { role: 'assistant', content: responseMessage, timestamp: new Date().toISOString() },
      ];
      await saveConversation(user.id, messages, 'whatsapp');

      // Send response via WhatsApp
      await sendWhatsAppMessage(parsed.from, responseMessage);

      logger.info('✅ Message processed with LLM', {
        from: parsed.from,
        action: llmResponse.action,
      });
    } catch (error) {
      logger.error('Error processing message with LLM', {
        error: error instanceof Error ? error.message : String(error),
        from: parsed.from,
      });
      // Send fallback response
      await sendWhatsAppMessage(
        parsed.from,
        'Hubo un error procesando tu mensaje. Intenta nuevamente.',
      );
    }
  } catch (error) {
    logger.error('Error processing webhook POST', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Response already sent with 200
  }
});

export { whatsappRouter };
