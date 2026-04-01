import expressWs from 'express-ws';
import WebSocket from 'ws';
import { createClient as createDeepgramClient, LiveTranscriptionEvent } from '@deepgram/sdk';
import { config } from '../config/env';
import { normalizeVoiceInput } from '../services/inputNormalizer';
import { getOrCreateSessionByPhone, updateSession } from '../services/sessionManager';
import { processMessage } from '../services/llmOrchestrator';
import { synthesizeAndSendVoice } from '../services/outputRouter';
import { createPaymentLink } from '../services/paymentService';

export function applyVoiceRoutes(wsApp: expressWs.Application): void {
  wsApp.ws('/voice/:restaurantSlug', (ws, req) => {
    const { restaurantSlug } = req.params;

    if (!/^[a-z0-9_]+$/.test(restaurantSlug)) {
      ws.close(1008, 'Invalid tenant');
      return;
    }

    console.log(`[voice] New call for tenant: ${restaurantSlug}`);

    let dgFinished = false;
    let streamSid = '';
    let callerNumber = '';

    const deepgram = createDeepgramClient(config.deepgram.apiKey);

    const dgLive = deepgram.listen.live({
      model: 'nova-2',
      language: 'es',
      encoding: 'mulaw',
      sample_rate: 8000,
      channels: 1,
      endpointing: 300,
      utterance_end_ms: 1000,
      interim_results: false,
    });

    dgLive.on('open', () => {
      console.log(`[voice][${restaurantSlug}] Deepgram connection opened`);
    });

    dgLive.on('transcript', async (data: LiveTranscriptionEvent) => {
      const transcript = data?.channel?.alternatives?.[0]?.transcript ?? '';
      if (!transcript.trim()) return;

      console.log(`[voice][${restaurantSlug}] Transcript: "${transcript}"`);

      // P0 FIX: No procesar transcripts hasta tener streamSid válido (evita sesiones 'unknown')
      if (!streamSid) {
        console.log(`[voice][${restaurantSlug}] Waiting for streamSid before processing transcript`);
        return;
      }

      const input = normalizeVoiceInput(restaurantSlug, streamSid, transcript, callerNumber);
      if (!input) return;

      try {
        const session = await getOrCreateSessionByPhone(restaurantSlug, callerNumber || streamSid, 'voice');
        const llmResponse = await processMessage(input, session);

        await updateSession(restaurantSlug, session.id, llmResponse.sessionUpdate);

        // Use updated draft from this turn (items may have been added in same message as confirm)
        const currentItems = llmResponse.sessionUpdate.order_draft?.items ?? session.order_draft.items;
        if (llmResponse.triggerPayment && currentItems.length > 0) {
          try {
            const paymentUrl = await createPaymentLink(
              session.id,
              restaurantSlug,
              session.id,
              currentItems,
            );
            await updateSession(restaurantSlug, session.id, {
              stripe_payment_link: paymentUrl,
              status: 'awaiting_payment',
            });
          } catch (err) {
            console.error(`[voice][${restaurantSlug}] Stripe error:`, (err as Error).message);
          }
        }

        if (llmResponse.reply && ws.readyState === WebSocket.OPEN) {
          await synthesizeAndSendVoice(ws, streamSid, llmResponse.reply);
        }
      } catch (err) {
        console.error(`[voice][${restaurantSlug}] Pipeline error:`, (err as Error).message);
      }
    });

    dgLive.on('error', (err: Error) => {
      console.error(`[voice][${restaurantSlug}] Deepgram error:`, err.message);
    });

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          event: string;
          start?: { streamSid: string; callSid: string; customParameters?: Record<string, string> };
          media?: { payload: string };
        };

        if (msg.event === 'start' && msg.start) {
          streamSid = msg.start.streamSid;
          callerNumber = msg.start.customParameters?.['callerNumber'] ?? '';
          console.log(`[voice][${restaurantSlug}] Stream started: ${streamSid}, caller: ${callerNumber}`);
        } else if (msg.event === 'media' && msg.media?.payload) {
          const audioBuffer = Buffer.from(msg.media.payload, 'base64');
          dgLive.send(audioBuffer.buffer.slice(
            audioBuffer.byteOffset,
            audioBuffer.byteOffset + audioBuffer.byteLength,
          ) as ArrayBuffer);
        } else if (msg.event === 'stop') {
          console.log(`[voice][${restaurantSlug}] Call ended`);
          if (!dgFinished) { dgFinished = true; dgLive.finish(); }
        }
      } catch {
        // Malformed message — ignore
      }
    });

    ws.on('close', () => {
      if (!dgFinished) { dgFinished = true; dgLive.finish(); }
      console.log(`[voice][${restaurantSlug}] WebSocket closed`);
    });
  });
}
