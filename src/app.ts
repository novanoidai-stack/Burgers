import express from 'express';
import expressWs from 'express-ws';
import healthRouter from './routes/health';
import whatsappRouter from './routes/whatsapp';
import { applyVoiceRoutes } from './routes/voice';
import twimlRouter from './routes/twiml';

export function createApp() {
  const app = express();
  const { app: wsApp } = expressWs(app);

  wsApp.use(express.json({ limit: '50kb' }));
  wsApp.use(healthRouter);
  wsApp.use(whatsappRouter);
  wsApp.use(twimlRouter);
  applyVoiceRoutes(wsApp);

  return wsApp;
}
