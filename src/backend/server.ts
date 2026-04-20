import express from 'express';
import expressWs from 'express-ws';
import healthRouter from './routes/health';
import whatsappRouter from './routes/whatsapp';
import stripeWebhookRouter from './routes/stripeWebhook';
import { applyVoiceRoutes } from './routes/voice';
import twimlRouter from './routes/twiml';

export function createApp() {
  const app = express();
  const { app: wsApp } = expressWs(app);

  // Stripe webhook MUST receive raw body — register BEFORE express.json()
  wsApp.use('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRouter);

  wsApp.use(express.json({ limit: '50kb' }));
  wsApp.use(healthRouter);
  wsApp.use(whatsappRouter);
  wsApp.use(twimlRouter);
  applyVoiceRoutes(wsApp);

  return wsApp;
}
