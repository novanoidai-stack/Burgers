// WhatsApp Message from Meta webhook
export interface WhatsAppMessage {
  from: string;
  type: string;
  text?: {
    body: string;
  };
  timestamp: string;
  id: string;
}

// Meta WhatsApp webhook entry
export interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      messages?: WhatsAppMessage[];
      contacts?: Array<{ profile: { name: string }; wa_id: string }>;
      statuses?: Array<{ id: string; status: string; timestamp: string }>;
    };
    field: string;
  }>;
}

// Claude API response
export interface ClaudeResponse {
  action: string;
  order?: Order | null;
  response_message: string;
}

// Order status enum
export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// Order item
export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  modifications: string[];
  subtotal: number;
}

// Order
export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  channel: 'whatsapp' | 'voice';
  created_at: string;
}

// User
export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

// Conversation message
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Conversation
export interface Conversation {
  id: string;
  user_id: string;
  order_id?: string;
  messages: ConversationMessage[];
  channel: 'whatsapp' | 'voice';
}
