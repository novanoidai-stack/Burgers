// src/types/conversation.ts

export type ConversationStatus =
  | 'greeting'
  | 'taking_order'
  | 'confirming'
  | 'awaiting_payment'
  | 'paid'
  | 'done'
  | 'abandoned';

export type InputChannel = 'voice' | 'whatsapp';

export interface NormalizedInput {
  tenantSlug: string;   // e.g. '001'
  sessionId: string;    // voice: call SID / whatsapp: phone number
  channel: InputChannel;
  text: string;
  phoneNumber?: string; // caller phone number
}

// Matches restaurant_001.sessions row (post migration 003)
export interface SessionRow {
  id: string;
  customer_id: string | null;
  channel: InputChannel;
  order_draft: OrderDraft;
  llm_history: LLMMessage[];
  status: ConversationStatus;
  phone_number: string | null;
  stripe_payment_link: string | null;
  stripe_payment_intent_id: string | null;
  order_id: string | null;
  created_at: string;
  last_activity: string;
}

export interface OrderDraft {
  items: DraftItem[];
  status: 'taking_order' | 'confirmed';
}

export interface DraftItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number; // in euros
  modifiers: string[];
}

// Matches restaurant_001.products row
export interface ProductRow {
  id: string;
  name: string;
  price: number; // in euros (DECIMAL from DB)
  category: string;
  description: string;
  is_available: boolean;
  allowed_modifications: string[];
}

// OpenAI-compatible message format (used by OpenRouter)
export type LLMMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface LLMResponse {
  reply: string;
  sessionUpdate: Partial<Pick<SessionRow, 'llm_history' | 'order_draft' | 'status' | 'phone_number'>>;
  triggerPayment?: boolean; // true when confirm_order was called
}
