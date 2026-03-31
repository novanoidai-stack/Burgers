import express from 'express';
import healthRouter from './routes/health';
import whatsappRouter from './routes/whatsapp';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '50kb' }));

  app.use(healthRouter);
  app.use(whatsappRouter);

  return app;
}
