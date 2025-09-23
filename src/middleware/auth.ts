import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { APIError } from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    access_token: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new APIError('No authorization token provided', 401);
    }

    // First, try to decode as JWT (OAuth flow)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        access_token: decoded.access_token
      };

      logger.info('Authenticated via JWT token', { userId: decoded.id });
      next();
    } catch (jwtError) {
      // If JWT verification fails, check if it's a valid Snapchat token format
      // Snapchat tokens are typically long alphanumeric strings with dots
      if (token.length > 30 && /^[a-zA-Z0-9._-]+$/.test(token)) {
        // Treat as raw Snapchat access token
        req.user = {
          id: 'direct_user',
          email: 'direct@api.user',
          access_token: token
        };
        
        logger.info('Authenticated via direct Snapchat token');
        next();
      } else {
        logger.warn('Invalid token format', { tokenLength: token.length, tokenStart: token.substring(0, 10) + '...' });
        throw new APIError('Invalid token format', 401);
      }
    }
  } catch (error) {
    if (error instanceof APIError) {
      next(error);
    } else {
      next(new APIError('Authentication failed', 401));
    }
  }
};