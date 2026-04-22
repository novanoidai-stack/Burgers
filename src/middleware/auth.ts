import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Reserved for use by the Express error handler layer (see src/middleware/errorHandler.ts in F2+)
// Throw this from routes to produce a consistent 4xx response via the global error handler.
export class AuthError extends Error {}

// Extend Express Request to carry tenant slug
declare global {
  namespace Express {
    interface Request {
      tenant: string;
    }
  }
}

interface TokenPayload extends jwt.JwtPayload {
  tenant: string;
}

export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

    if (!payload.tenant || typeof payload.tenant !== 'string') {
      res.status(401).json({ error: 'Token missing tenant claim' });
      return;
    }

    // Enforce slug format matches what tenantClient.ts accepts
    const VALID_TENANT_SLUG = /^[a-z0-9_]+$/;
    if (!VALID_TENANT_SLUG.test(payload.tenant)) {
      res.status(401).json({ error: 'Invalid tenant identifier in token' });
      return;
    }

    req.tenant = payload.tenant;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    next(err); // propagate unexpected errors to Express error handler
  }
}
