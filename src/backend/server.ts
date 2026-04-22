import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './middleware/logger';
import { attachErrorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50kb' }));

  // Logging middleware
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use(healthRouter);

  // Webhooks (to be implemented)
  app.post('/webhooks/whatsapp', (req, res) => {
    res.json({ success: true });
  });

  // API routes (to be implemented)
  app.get('/api/orders', (req, res) => {
    res.json({ orders: [] });
  });

  // Error handling (must be last)
  attachErrorHandler(app);

  return app;
}

export function startServer(): void {
  try {
    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`🍔 Novo Burger server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}
