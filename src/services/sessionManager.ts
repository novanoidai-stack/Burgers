import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { SessionRow, OrderDraft, InputChannel, ConversationStatus } from '../types/conversation';

function getTenantClient(tenantSlug: string) {
  const client = createClient(config.supabase.url, config.supabase.serviceKey);
  return client.schema(`restaurant_${tenantSlug}`);
}

export function buildEmptyOrderDraft(): OrderDraft {
  return { items: [], status: 'taking_order' };
}

export async function createSession(
  tenantSlug: string,
  channel: InputChannel,
  phoneNumber: string,
): Promise<SessionRow> {
  if (!tenantSlug) throw new Error('tenantSlug required');

  const db = getTenantClient(tenantSlug);
  const { data, error } = await (db as any)
    .from('sessions')
    .insert({
      channel,
      phone_number: phoneNumber,
      order_draft: buildEmptyOrderDraft(),
      llm_history: [],
      status: 'greeting',
      last_activity: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`createSession failed: ${error.message}`);
  return data as SessionRow;
}

export async function getSessionById(
  tenantSlug: string,
  sessionId: string,
): Promise<SessionRow | null> {
  const db = getTenantClient(tenantSlug);
  const { data } = await (db as any)
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  return (data as SessionRow) ?? null;
}

export async function getOrCreateSessionByPhone(
  tenantSlug: string,
  phoneNumber: string,
  channel: InputChannel,
): Promise<SessionRow> {
  const db = getTenantClient(tenantSlug);

  const { data } = await (db as any)
    .from('sessions')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('channel', channel)
    .not('status', 'in', '("paid","done","abandoned")')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return data as SessionRow;
  return createSession(tenantSlug, channel, phoneNumber);
}

export async function updateSession(
  tenantSlug: string,
  sessionId: string,
  fields: Partial<Pick<SessionRow,
    | 'llm_history'
    | 'order_draft'
    | 'status'
    | 'phone_number'
    | 'stripe_payment_link'
    | 'stripe_payment_intent_id'
    | 'order_id'
  >>,
): Promise<void> {
  const db = getTenantClient(tenantSlug);
  const { error } = await (db as any)
    .from('sessions')
    .update({ ...fields, last_activity: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw new Error(`updateSession failed: ${error.message}`);
}
