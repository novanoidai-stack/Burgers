import express from 'express';
import healthRouter from './routes/health';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '50kb' }));

  app.use(healthRouter);

  return app;
}
