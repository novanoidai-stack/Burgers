export type Channel = 'voice' | 'whatsapp' | 'web';
export type DeliveryType = 'takeaway' | 'delivery' | 'table';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'sent_to_tpv'
  | 'in_preparation'
  | 'ready'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'stripe' | 'mercado_pago' | 'cash';

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  modifications: string[];
  unit_price: number;
  subtotal: number;
}

export interface OrderDelivery {
  type: DeliveryType;
  address?: {
    street: string;
    city: string;
    postal_code: string;
    notes?: string;
  };
  table_number?: string;
  estimated_time_min?: number;
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax: number;
  delivery_fee: number;
  total: number;
}

export interface OrderPayment {
  status: PaymentStatus;
  method?: PaymentMethod;
  stripe_payment_intent_id?: string;
  link?: string;
  paid_at?: string;
}

export interface OrderClient {
  phone: string;
  name?: string;
  email?: string;
}

export interface Order {
  id: string;
  session_id: string;
  channel: Channel;
  restaurant_id: string;
  client: OrderClient;
  delivery: OrderDelivery;
  items: OrderItem[];
  summary: OrderSummary;
  payment: OrderPayment;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type OrderDraft = Omit<Order, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
