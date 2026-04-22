import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../middleware/logger';
import { User, Order, OrderStatus, OrderItem, ConversationMessage } from '../types';

let supabase: SupabaseClient;

export function initSupabase(): void {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase URL or key not configured');
  }

  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
}

export async function testConnection(): Promise<void> {
  try {
    if (!supabase) {
      initSupabase();
    }
    const { count, error } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }
    logger.info(`✅ Supabase connected (${count || 0} menu items)`);
  } catch (error) {
    logger.error('Supabase connection failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function findOrCreateUser(phone: string): Promise<User> {
  try {
    if (!supabase) initSupabase();

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existing) {
      return existing as User;
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ phone }])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return newUser as User;
  } catch (error) {
    logger.error('Failed to find or create user', {
      phone,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getMenuItems(): Promise<OrderItem[]> {
  try {
    if (!supabase) initSupabase();

    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, price, category, description')
      .eq('available', true);

    if (error) {
      throw error;
    }
    return data as OrderItem[];
  } catch (error) {
    logger.error('Failed to get menu items', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function createOrder(
  userId: string,
  items: OrderItem[],
  total: number,
  channel: 'whatsapp' | 'voice',
): Promise<Order> {
  try {
    if (!supabase) initSupabase();

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          items,
          total,
          channel,
          status: 'pending' as OrderStatus,
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Order;
  } catch (error) {
    logger.error('Failed to create order', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    if (!supabase) initSupabase();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data as Order;
  } catch (error) {
    logger.error('Failed to get order', {
      orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  try {
    if (!supabase) initSupabase();

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Order;
  } catch (error) {
    logger.error('Failed to update order status', {
      orderId,
      status,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function saveConversation(
  userId: string,
  messages: ConversationMessage[],
  channel: 'whatsapp' | 'voice',
  orderId?: string,
): Promise<void> {
  try {
    if (!supabase) initSupabase();

    const { error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: userId,
          order_id: orderId || null,
          messages,
          channel,
        },
      ]);

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Failed to save conversation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getConversation(userId: string): Promise<ConversationMessage[]> {
  try {
    if (!supabase) initSupabase();

    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return [];
      }
      throw error;
    }
    return (data?.messages as ConversationMessage[]) || [];
  } catch (error) {
    logger.error('Failed to get conversation', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export { supabase };
