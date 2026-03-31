import expressWs from 'express-ws';
import { createClient as createDeepgramClient } from '@deepgram/sdk';
import { config } from '../config/env';

/**
 * Registers the voice WebSocket route on a ws-patched Express application.
 * Must be called AFTER expressWs(app) so the .ws() method is available.
 */
export function applyVoiceRoutes(wsApp: expressWs.Application): void {
  wsApp.ws('/voice/:restaurantSlug', (ws, req) => {
    const { restaurantSlug } = req.params;
    console.log(`[voice] New call for tenant: ${restaurantSlug}`);

    const deepgram = createDeepgramClient(config.deepgram.apiKey);

    // Open a live transcription session
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

    dgLive.on('transcript', (data) => {
      const transcript = (data as { channel?: { alternatives?: Array<{ transcript?: string }> } })
        ?.channel?.alternatives?.[0]?.transcript ?? '';
      if (transcript.trim()) {
        console.log(`[voice][${restaurantSlug}] Transcript: "${transcript}"`);
      }
    });

    dgLive.on('error', (err: Error) => {
      console.error(`[voice][${restaurantSlug}] Deepgram error:`, err.message);
    });

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as { event: string; media?: { payload: string } };

        if (msg.event === 'media' && msg.media?.payload) {
          const audioBuffer = Buffer.from(msg.media.payload, 'base64');
          dgLive.send(audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength) as ArrayBuffer);
        } else if (msg.event === 'stop') {
          console.log(`[voice][${restaurantSlug}] Call ended`);
          dgLive.finish();
        }
      } catch {
        // Malformed message — ignore
      }
    });

    ws.on('close', () => {
      dgLive.finish();
      console.log(`[voice][${restaurantSlug}] WebSocket closed`);
    });
  });
}
