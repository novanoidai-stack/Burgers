import winston from 'winston';
import { config } from '../config';

// Redact sensitive keys
function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['key', 'token', 'secret', 'password', 'api_key', 'auth'];
  const redacted = { ...data };

  for (const key in redacted) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      redacted[key] = '***REDACTED***';
    }
  }

  return redacted;
}

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length
        ? JSON.stringify(redactSensitiveData(meta as Record<string, unknown>))
        : '';
      const errorStr = stack ? `\n${stack}` : '';
      return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr ? ` ${metaStr}` : ''}${errorStr}`;
    }),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(redactSensitiveData(meta as Record<string, unknown>))
            : '';
          const errorStr = stack ? `\n${stack}` : '';
          return `${timestamp} [${level}] ${message}${metaStr ? ` ${metaStr}` : ''}${errorStr}`;
        }),
      ),
    }),
  ],
});
