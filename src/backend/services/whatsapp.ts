import { config } from '../config';
import { logger } from '../middleware/logger';
import { WhatsAppMessage } from '../types';

export interface ParsedWebhookMessage {
  from: string;
  text: string;
  messageId: string;
  timestamp: string;
  contactName?: string;
}

export async function verifyWebhook(
  mode: string,
  token: string,
  challenge: string,
): Promise<string | null> {
  try {
    if (mode !== 'subscribe') {
      logger.warn('Webhook verification failed: invalid mode', { mode });
      return null;
    }

    if (token !== config.whatsappWebhookToken) {
      logger.warn('Webhook verification failed: invalid token');
      return null;
    }

    logger.info('✅ Webhook verified successfully');
    return challenge;
  } catch (error) {
    logger.error('Error verifying webhook', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function parseWebhookMessage(body: any): ParsedWebhookMessage | null {
  try {
    if (!body || !body.entry) {
      logger.warn('Invalid webhook body: no entry');
      return null;
    }

    const entry = body.entry[0];
    if (!entry || !entry.changes) {
      logger.warn('Invalid webhook body: no changes');
      return null;
    }

    const change = entry.changes[0];
    if (!change || !change.value) {
      logger.warn('Invalid webhook body: no value');
      return null;
    }

    const value = change.value;

    // Extract message
    if (!value.messages || value.messages.length === 0) {
      logger.debug('Webhook: no messages in payload');
      return null;
    }

    const message = value.messages[0] as WhatsAppMessage;
    if (!message.text || !message.text.body) {
      logger.warn('Invalid message: no text body');
      return null;
    }

    // Extract contact name (optional)
    let contactName: string | undefined;
    if (value.contacts && value.contacts.length > 0) {
      contactName = value.contacts[0].profile?.name;
    }

    const parsed: ParsedWebhookMessage = {
      from: message.from,
      text: message.text.body,
      messageId: message.id,
      timestamp: message.timestamp,
      contactName,
    };

    logger.info('📩 Mensaje recibido', {
      from: parsed.from,
      text: parsed.text.substring(0, 50),
      contactName: parsed.contactName,
    });

    return parsed;
  } catch (error) {
    logger.error('Error parsing webhook message', {
      error: error instanceof Error ? error.message : String(error),
      body: JSON.stringify(body).substring(0, 200),
    });
    return null;
  }
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    if (!config.whatsappAccessToken || !config.whatsappPhoneNumberId) {
      logger.error('WhatsApp not configured: missing accessToken or phoneNumberId');
      return false;
    }

    const url = `https://graph.instagram.com/v18.0/${config.whatsappPhoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.whatsappAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to send WhatsApp message', {
        status: response.status,
        error: error.substring(0, 200),
        to,
      });
      return false;
    }

    const result = await response.json() as { messages?: Array<{ id: string }> };
    if (result.messages && result.messages.length > 0) {
      logger.info('✅ WhatsApp message sent', {
        to,
        messageId: result.messages[0].id,
      });
      return true;
    }

    logger.warn('WhatsApp message sent but no message ID returned', { to });
    return true;
  } catch (error) {
    logger.error('Error sending WhatsApp message', {
      to,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
