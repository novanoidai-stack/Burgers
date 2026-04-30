import { Router } from 'express';
import { config } from '../config/env';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() });
});

export default router;
