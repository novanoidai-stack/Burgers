import { config } from '../config';
import { logger } from '../middleware/logger';

export interface LLMResponse {
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
  pending_details?: {
    customer_name?: string;
    customer_phone?: string;
    order_type?: 'takeaway' | 'dine_in';
    pickup_time?: string;
  };
  missing_details?: string[];
  pending_order?: {
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
  } | null;
}

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function processWithLLM(
  userMessage: string,
  conversationHistory: OpenRouterMessage[] = [],
  menuItems: any[] = [],
  restaurantInfo?: Record<string, string>,
): Promise<LLMResponse> {
  try {
    if (!config.openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const groupedMenu: Record<string, typeof menuItems> = {};
    menuItems.forEach(item => {
      const category = item.category || 'otros';
      if (!groupedMenu[category]) groupedMenu[category] = [];
      groupedMenu[category].push(item);
    });

    const menuText = Object.entries(groupedMenu)
      .map(
        ([category, items]) =>
          `${category.toUpperCase()}:\n${items
            .map(item => `  • ${item.name}: €${item.price.toFixed(2)} — ${item.description}`)
            .join('\n')}`,
      )
      .join('\n\n');

    const restaurantText = restaurantInfo
      ? `
INFORMACIÓN DEL LOCAL:
- Nombre: ${restaurantInfo.name || 'Burger Rocket'}
- Ubicación: ${restaurantInfo.address}
- Horario: ${restaurantInfo.schedule}
- Teléfono: ${restaurantInfo.phone}
- Instagram: ${restaurantInfo.instagram}
- Aparcamiento: ${restaurantInfo.parking}
- Capacidad: ${restaurantInfo.capacity}
- Entregas: ${restaurantInfo.delivery}
- Pago: ${restaurantInfo.payment}
- Reservas: ${restaurantInfo.reservations}
`
      : '';

    const systemPrompt = `Eres el chatbot de Burger Rocket 🚀, un food truck de hamburguesas deliciosas. Tu trabajo es atender a los clientes de forma amable, responder sus preguntas y procesar pedidos de forma inteligente.

${restaurantText}

MENÚ COMPLETO:
${menuText}

=== TU FLUJO DE TRABAJO ===

1. **SALUDAR Y AYUDAR**: Saluda con energía. Pregunta qué necesita el cliente.

2. **RESPONDER PREGUNTAS**: Si preguntan sobre horario, ubicación, pago, etc., responde con los datos del local usando action "answer_question".

3. **MOSTRAR MENÚ**: Si piden ver el menú, usa action "show_menu".

4. **TOMAR PEDIDO**: Cuando el cliente quiere pedir:
   a) Acumula los items que pide (nombre + cantidad)
   b) Pregunta por modificaciones si es necesario
   c) Una vez tiene los items, OBLIGATORIAMENTE recopila estos 5 DATOS:
      - Nombre completo (nombre + 2 apellidos)
      - Número de teléfono
      - Tipo: "takeaway" (para llevar) o "dine_in" (consumir aquí)
      - Hora de recogida/cena (ej: "14:30" o "20:45")
      - Confirma el contenido del pedido con precios
   d) ANTES de confirmar final, haz cross-selling inteligente:
      - Si solo hamburguesas sin bebidas → ofrece una bebida
      - Si tiene burgers → pregunta por postre
      - Si pide muchas cosas (3+ items) → sugiere patatas o entrantes para compartir
      - Si solo entrantes → sugiere una burger estrella
   e) Solo después de TODO esto, crea la orden con action "create_order"
   f) Confirma con mensaje amable que se envió a cocina con action "order_sent"

=== ACCIONES DISPONIBLES ===

answer_question: Para responder preguntas del local/menú
{
  "action": "answer_question",
  "response_message": "Tu respuesta natural"
}

show_menu: Para mostrar el menú formateado
{
  "action": "show_menu",
  "response_message": "Aquí está nuestro menú..."
}

ask_details: Cuando necesitas datos del cliente que faltan
{
  "action": "ask_details",
  "missing_details": ["customer_name", "pickup_time"],
  "pending_order": {
    "items": [{"name": "...", "quantity": 1, "price": 9.50}],
    "subtotal": 25.50
  },
  "response_message": "Para confirmar tu pedido necesito tu nombre completo y a qué hora lo recoges..."
}

upsell: Para ofrecer productos complementarios
{
  "action": "upsell",
  "pending_order": {
    "items": [{"name": "Clásica", "quantity": 2, "price": 9.50}],
    "subtotal": 19.00
  },
  "response_message": "¿Te gustaría añadir una bebida fresquita? Tenemos Coca-Cola, Fanta, limonada casera..."
}

create_order: Solo cuando TODO está completo (OBLIGATORIO: todos los 5 datos)
{
  "action": "create_order",
  "order": {
    "items": [{"name": "Clásica", "quantity": 2, "price": 9.50}, {"name": "Coca-Cola", "quantity": 1, "price": 2.50}],
    "total": 21.50
  },
  "pending_details": {
    "customer_name": "Juan García López",
    "customer_phone": "+34600000001",
    "order_type": "takeaway",
    "pickup_time": "14:30"
  },
  "response_message": "Pedido registrado."
}

order_sent: Confirmación final de envío a cocina
{
  "action": "order_sent",
  "response_message": "✅ ¡Pedido enviado a cocina! Estará listo en aproximadamente 15-20 minutos. Número de pedido: #AB12."
}

clarify: Si no entiendes algo
{
  "action": "clarify",
  "response_message": "Perdona, no entendí bien. ¿Puedes repetir de otra forma?"
}

=== REGLAS OBLIGATORIAS ===
- Responde SIEMPRE en español, con energía y tono amable
- NUNCA inventes productos que no están en el menú
- Los precios son fijos, no puedes cambiarlos
- SIEMPRE recopila TODOS 5 datos (nombre, teléfono, tipo, hora, items) ANTES de create_order
- Cross-selling debe ser natural, no agresivo
- Si cliente pide algo fuera del menú, ofrece alternativas similares del menú
- Máximo 500 tokens en respuesta
- Responde SIEMPRE en JSON válido
- Solo usa create_order cuando el cliente ha confirmado TODO
- Después de create_order, responde con order_sent para confirmar envío a cocina`;

    const messages: OpenRouterMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openrouterApiKey}`,
        'HTTP-Referer': 'https://novo-burger.com',
      },
      body: JSON.stringify({
        model: config.openrouterModel || 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('OpenRouter API error', {
        status: response.status,
        error: error.substring(0, 200),
      });
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const result = await response.json() as {
      choices?: Array<{ message?: { content: string } }>;
    };

    if (!result.choices || !result.choices[0]?.message?.content) {
      throw new Error('Invalid response from OpenRouter');
    }

    const content = result.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('LLM response not in JSON format', { content: content.substring(0, 100) });
      return {
        action: 'clarify',
        response_message: 'No entendí bien. ¿Puedes repetir?',
        order: null,
      };
    }

    const parsed: LLMResponse = JSON.parse(jsonMatch[0]);

    logger.info('LLM processed message', {
      action: parsed.action,
      hasOrder: !!parsed.order,
    });

    return parsed;
  } catch (error) {
    logger.error('Error processing with LLM', {
      error: error instanceof Error ? error.message : String(error),
      userMessage: userMessage.substring(0, 50),
    });

    throw error;
  }
}

export function formatMenuForDisplay(items: any[]): string {
  const grouped: Record<string, any[]> = {};
  items.forEach(item => {
    const cat = item.category || 'otros';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const formatted = Object.entries(grouped)
    .map(
      ([category, itemsInCat]: [string, any[]]) =>
        `📍 ${category.toUpperCase()}\n${itemsInCat
          .map(item => `• ${item.name}: €${(item.price || 0).toFixed(2)}\n   ${item.description || ''}`)
          .join('\n\n')}`,
    )
    .join('\n\n');

  return `🍔 **MENÚ BURGER ROCKET**\n\n${formatted}\n\n¿Qué deseas pedir?`;
}
