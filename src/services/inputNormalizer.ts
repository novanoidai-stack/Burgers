import { NormalizedInput } from '../types/conversation';

export function normalizeVoiceInput(
  tenantSlug: string,
  callSid: string,
  transcript: string,
  phoneNumber: string,
): NormalizedInput | null {
  const text = transcript.trim();
  if (!text) return null;
  return { tenantSlug, sessionId: callSid, channel: 'voice', text, phoneNumber };
}

export function normalizeWhatsAppInput(
  tenantSlug: string,
  from: string,
  messageText: string,
): NormalizedInput | null {
  const text = messageText.trim();
  if (!text) return null;
  return { tenantSlug, sessionId: from, channel: 'whatsapp', text, phoneNumber: from };
}
