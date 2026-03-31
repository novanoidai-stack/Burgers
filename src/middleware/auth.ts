import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export class AuthError extends Error {}

// Extend Express Request to carry tenant slug
declare global {
  namespace Express {
    interface Request {
      tenant: string;
    }
  }
}

interface TokenPayload {
  tenant: string;
  iat: number;
  exp: number;
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

    req.tenant = payload.tenant;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
