import { config } from '../config';
import { logger } from '../middleware/logger';

export interface LLMResponse {
  action: 'create_order' | 'show_menu' | 'confirm_order' | 'clarify' | 'answer_question';
  order?: {
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
  } | null;
  response_message: string;
}

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function processWithLLM(
  userMessage: string,
  conversationHistory: OpenRouterMessage[] = [],
  menuItems: Array<{ name: string; price: number; description: string }> = [],
): Promise<LLMResponse> {
  try {
    if (!config.openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const menuText = menuItems
      .map(item => `- ${item.name}: $${item.price} (${item.description})`)
      .join('\n');

    const systemPrompt = `Eres el asistente virtual de Novo Burger, una hamburguesería inteligente.

MENÚ DISPONIBLE:
${menuText}

TU TRABAJO:
1. Saludar amablemente al cliente
2. Mostrar el menú cuando lo pidan
3. Tomar pedidos (preguntar cantidad, modificaciones)
4. Confirmar el pedido completo antes de procesar
5. Responder preguntas sobre el menú

REGLAS IMPORTANTES:
- Sé amable, informal pero profesional
- Responde SIEMPRE en español
- Si el cliente pide algo que no está en el menú, díselo amablemente
- NUNCA inventes items que no están en el menú
- Si no entiendes, pide aclaración
- Siempre confirma el pedido completo antes de procesar

DEBES RESPONDER EN JSON CON ESTA ESTRUCTURA:
{
  "action": "create_order" | "show_menu" | "confirm_order" | "clarify" | "answer_question",
  "order": {
    "items": [{"name": "...", "quantity": 1, "price": 0.00}],
    "total": 0.00
  } | null,
  "response_message": "Tu mensaje al cliente aquí"
}`;

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

    // Parse JSON response from LLM
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

export function formatMenuForDisplay(
  items: Array<{ name: string; price: number; description: string }>,
): string {
  return (
    '📋 **MENÚ NOVO BURGER**\n\n' +
    items
      .map(item => `• ${item.name}: $${item.price}\n  ${item.description}`)
      .join('\n\n') +
    '\n\n¿Qué deseas?'
  );
}
