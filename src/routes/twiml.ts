import { Router } from 'express';
import { config } from '../config/env';

const router = Router();

router.post('/twiml/voice/:restaurantSlug', (req, res) => {
  const { restaurantSlug } = req.params;

  if (!/^[a-z0-9_]+$/.test(restaurantSlug)) {
    res.status(400).type('text/plain').send('Invalid tenant');
    return;
  }

  const host = config.baseUrl ? new URL(config.baseUrl).host : req.headers.host;
  const wsUrl = `wss://${host}/voice/${restaurantSlug}`;

  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`);
});

export default router;
