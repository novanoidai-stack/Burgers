import { Express, Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { config } from '../config';

export interface ErrorResponse {
  error: string;
  status: number;
  stack?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const status = (err as any).status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Request error', {
    status,
    message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  const response: ErrorResponse = {
    error: message,
    status,
  };

  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

export function attachErrorHandler(app: Express): void {
  app.use(errorHandler);
}
