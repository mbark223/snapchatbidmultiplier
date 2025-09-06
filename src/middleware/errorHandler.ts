import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class APIError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'APIError';
  }
}

export const errorHandler = (
  err: Error | APIError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof APIError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const errors = err instanceof APIError ? err.errors : undefined;

  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(statusCode).json({
    error: message,
    errors,
    status: statusCode,
    timestamp: new Date().toISOString()
  });
};