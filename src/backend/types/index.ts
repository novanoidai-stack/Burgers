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

// Pending order details
export interface PendingOrderDetails {
  customer_name?: string;
  customer_phone?: string;
  order_type?: 'takeaway' | 'dine_in';
  pickup_time?: string;
}

// Claude API response
export interface ClaudeResponse {
  action:
    | 'create_order'
    | 'show_menu'
    | 'confirm_order'
    | 'clarify'
    | 'answer_question'
    | 'ask_details'
    | 'upsell'
    | 'order_sent';
  order?: {
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
  } | null;
  response_message: string;
  pending_details?: PendingOrderDetails;
  missing_details?: string[];
  pending_order?: {
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
  } | null;
}

// Order status enum
export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// Order item
export interface OrderItem {
  product_id?: string;
  id?: string;
  name: string;
  quantity?: number;
  price?: number;
  modifications?: string[];
  subtotal?: number;
  description?: string;
  category?: string;
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
  customer_name?: string;
  customer_phone?: string;
  order_type?: 'takeaway' | 'dine_in';
  pickup_time?: string;
  notes?: string;
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
