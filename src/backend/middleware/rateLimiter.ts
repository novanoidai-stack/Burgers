import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly WINDOW_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 20; // 20 messages per minute per phone

  isAllowed(phone: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(phone);

    // Create new entry if doesn't exist or is expired
    if (!entry || now > entry.resetAt) {
      this.limits.set(phone, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= this.MAX_REQUESTS) {
      logger.warn('Rate limit exceeded', { phone, count: entry.count });
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  getRemainingRequests(phone: string): number {
    const entry = this.limits.get(phone);
    if (!entry) return this.MAX_REQUESTS;
    const remaining = this.MAX_REQUESTS - entry.count;
    return Math.max(0, remaining);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [phone, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(phone);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const phone = (req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
    req.query.from ||
    'unknown') as string;

  if (!rateLimiter.isAllowed(phone)) {
    logger.warn('Rate limit exceeded for phone', { phone });
    res.status(429).json({
      error: 'Too many requests. Please wait a moment and try again.',
      remaining: rateLimiter.getRemainingRequests(phone),
    });
    return;
  }

  next();
}
