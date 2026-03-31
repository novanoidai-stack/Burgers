import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import {
  NormalizedInput, SessionRow, ProductRow, LLMMessage,
  ToolCall, LLMResponse, DraftItem, OrderDraft,
} from '../types/conversation';

function getOpenRouterClient(): OpenAI {
  return new OpenAI({
    apiKey: config.openrouter.apiKey ?? 'no-key',
    baseURL: config.openrouter.baseUrl,
  });
}

export async function fetchMenu(tenantSlug: string): Promise<ProductRow[]> {
  const client = createClient(config.supabase.url, config.supabase.serviceKey);
  const db = client.schema(`restaurant_${tenantSlug}`);
  const { data, error } = await (db as any)
    .from('products')
    .select('id, name, price, category, description, is_available, allowed_modifications')
    .eq('is_available', true)
    .order('category')
    .order('price');

  if (error) throw new Error(`fetchMenu failed: ${error.message}`);
  return (data ?? []) as ProductRow[];
}

export function buildSystemPrompt(restaurantName: string, products: ProductRow[]): string {
  const categories = ['burger', 'racion', 'postre'];
  const labels: Record<string, string> = { burger: 'HAMBURGUESAS', racion: 'RACIONES', postre: 'POSTRES' };

  const menuText = categories
    .map(cat => {
      const items = products.filter(p => p.category === cat);
      if (!items.length) return '';
      return `${labels[cat]}:\n${items.map(p => `  - ${p.name} (ID: ${p.id}): ${p.price.toFixed(2)}€ — ${p.description}`).join('\n')}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `Eres el asistente de pedidos de ${restaurantName}, una smashburger en Pamplona.
Tu único trabajo es tomar pedidos de forma natural y amigable en español.

REGLAS ESTRICTAS:
- Solo puedes ofrecer productos del menú. No inventes productos ni precios.
- No autorices descuentos ni precios especiales.
- Si el cliente pregunta algo fuera del menú, redirige amablemente.
- Habla en español, tono cercano y eficiente.
- Cuando el cliente confirme el pedido, usa la función confirm_order.
- En llamadas de voz, cuando necesites enviar el link de pago, usa request_phone_number si no tienes el número.
- Siempre usa los IDs exactos del menú al llamar add_item.

MENÚ ACTUAL:
${menuText}`;
}

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'add_item',
      description: 'Añade un producto al pedido actual',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'UUID del producto del menú' },
          name: { type: 'string', description: 'Nombre del producto' },
          quantity: { type: 'number', description: 'Cantidad' },
          unit_price: { type: 'number', description: 'Precio unitario en euros' },
          modifiers: { type: 'array', items: { type: 'string' }, description: 'Modificaciones (ej: sin pepinillos)' },
        },
        required: ['product_id', 'name', 'quantity', 'unit_price'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_item',
      description: 'Elimina un producto del pedido',
      parameters: {
        type: 'object',
        properties: { product_id: { type: 'string' } },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_summary',
      description: 'Obtiene el resumen del pedido actual con precio total',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirm_order',
      description: 'Confirma el pedido y dispara el proceso de pago. Solo llamar cuando el cliente confirme explícitamente.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_phone_number',
      description: 'Pide el número de teléfono al cliente para enviarle el link de pago. Solo usar en canal de voz cuando no se tenga el número.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

export function applyToolCall(
  call: ToolCall,
  session: SessionRow,
  _products: ProductRow[],
): { toolResult: string; orderUpdate: Partial<{ items: DraftItem[]; status: 'taking_order' | 'confirmed' }>; triggerPayment?: boolean } {
  const args = JSON.parse(call.function.arguments);
  const items: DraftItem[] = [...(session.order_draft.items ?? [])];

  switch (call.function.name) {
    case 'add_item': {
      const existing = items.find(i => i.product_id === args.product_id);
      if (existing) {
        existing.quantity += args.quantity;
      } else {
        items.push({
          product_id: args.product_id,
          name: args.name,
          quantity: args.quantity,
          unit_price: args.unit_price,
          modifiers: args.modifiers ?? [],
        });
      }
      return { toolResult: `${args.name} x${args.quantity} añadido al pedido`, orderUpdate: { items } };
    }

    case 'remove_item': {
      const filtered = items.filter(i => i.product_id !== args.product_id);
      return { toolResult: 'Producto eliminado del pedido', orderUpdate: { items: filtered } };
    }

    case 'get_order_summary': {
      if (!items.length) return { toolResult: 'El pedido está vacío', orderUpdate: {} };
      const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
      const lines = items.map(i => `${i.name} x${i.quantity} = ${(i.unit_price * i.quantity).toFixed(2)}€`);
      return { toolResult: `Pedido: ${lines.join(', ')}. Total: ${total.toFixed(2)}€`, orderUpdate: {} };
    }

    case 'confirm_order': {
      return {
        toolResult: 'Pedido confirmado. Generando link de pago...',
        orderUpdate: { status: 'confirmed' },
        triggerPayment: true,
      };
    }

    case 'request_phone_number': {
      return { toolResult: 'Solicitando número de teléfono al cliente', orderUpdate: {} };
    }

    default:
      return { toolResult: 'Función desconocida', orderUpdate: {} };
  }
}

export async function processMessage(
  input: NormalizedInput,
  session: SessionRow,
  restaurantName = 'El Mesón',
): Promise<LLMResponse> {
  const products = await fetchMenu(input.tenantSlug);
  const systemPrompt = buildSystemPrompt(restaurantName, products);
  const client = getOpenRouterClient();

  const history: LLMMessage[] = [...(session.llm_history ?? [])];
  history.push({ role: 'user', content: input.text });

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(history as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
  ];

  const firstResponse = await client.chat.completions.create({
    model: config.openrouter.model,
    messages,
    tools: TOOLS,
    tool_choice: 'auto',
  });

  const assistantMsg = firstResponse.choices[0].message;
  let triggerPayment = false;
  const orderDraftUpdate: OrderDraft = {
    items: [...session.order_draft.items],
    status: session.order_draft.status,
  };

  if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
    history.push(assistantMsg as unknown as LLMMessage);

    for (const call of assistantMsg.tool_calls) {
      const { toolResult, orderUpdate, triggerPayment: tp } = applyToolCall(call as unknown as ToolCall, { ...session, order_draft: orderDraftUpdate }, products);
      if (tp) triggerPayment = true;
      if (orderUpdate.items !== undefined) orderDraftUpdate.items = orderUpdate.items;
      if (orderUpdate.status !== undefined) orderDraftUpdate.status = orderUpdate.status;
      history.push({ role: 'tool', tool_call_id: call.id, content: toolResult });
    }

    const finalResponse = await client.chat.completions.create({
      model: config.openrouter.model,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...(history as OpenAI.Chat.Completions.ChatCompletionMessageParam[]),
      ],
    });

    const finalText = finalResponse.choices[0].message.content ?? '';
    history.push({ role: 'assistant', content: finalText });

    const hasItems = orderDraftUpdate.items.length > 0;
    const newStatus = (triggerPayment && hasItems)
      ? 'awaiting_payment'
      : session.status === 'greeting'
        ? 'taking_order'
        : session.status;

    return {
      reply: finalText,
      triggerPayment: triggerPayment && hasItems,
      sessionUpdate: {
        llm_history: history,
        order_draft: orderDraftUpdate,
        status: newStatus,
      },
    };
  }

  const reply = assistantMsg.content ?? '';
  history.push({ role: 'assistant', content: reply });

  const newStatus = session.status === 'greeting' ? 'taking_order' : session.status;

  return {
    reply,
    sessionUpdate: {
      llm_history: history,
      order_draft: orderDraftUpdate,
      status: newStatus,
    },
  };
}
