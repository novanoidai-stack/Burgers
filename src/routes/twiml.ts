import { Router } from 'express';

const router = Router();

router.post('/twiml/voice/:restaurantSlug', (req, res) => {
  const { restaurantSlug } = req.params;
  const wsUrl = `wss://${req.headers.host}/voice/${restaurantSlug}`;

  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`);
});

export default router;
