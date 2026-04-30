import WebSocket from 'ws';
import { config } from '../config/env';

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_MODEL = 'eleven_turbo_v2_5';

export function buildTwilioAudioMessage(streamSid: string, base64Audio: string): string {
  return JSON.stringify({
    event: 'media',
    streamSid,
    media: { payload: base64Audio },
  });
}

// ulaw 8000Hz mono = 8000 bytes/s
export function estimateAudioDurationMs(audioBuffer: Buffer): number {
  return Math.round((audioBuffer.length / 8000) * 1000);
}

export async function synthesizeAndSendVoice(
  ws: WebSocket,
  streamSid: string,
  text: string,
): Promise<void> {
  const voiceId = config.elevenlabs.voiceId;
  const apiKey = config.elevenlabs.apiKey;

  if (!apiKey) {
    console.warn('[outputRouter] ELEVENLABS_API_KEY not set — skipping TTS');
    return;
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      output_format: 'ulaw_8000',
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${response.status} — ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  const base64Audio = audioBuffer.toString('base64');

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(buildTwilioAudioMessage(streamSid, base64Audio));
    ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'tts_end' } }));
  }
}

export async function sendWhatsAppText(to: string, text: string): Promise<void> {
  const apiUrl = config.evolution.apiUrl;
  const instance = config.evolution.instance;

  if (!apiUrl || !instance) {
    console.log(`[outputRouter][whatsapp] → ${to}: ${text}`);
    return;
  }

  const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      number: to,
      options: { delay: 200 },
      textMessage: { text },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Evolution API sendText failed: ${response.status} — ${errText}`);
  }
}
