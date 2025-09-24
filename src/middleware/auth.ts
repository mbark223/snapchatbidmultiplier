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
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('No authorization header provided');
      return next(new APIError('No authorization token provided', 401));
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Empty token after removing Bearer prefix');
      return next(new APIError('No authorization token provided', 401));
    }

    // Log token info for debugging (without exposing the actual token)
    logger.debug('Token info', { 
      length: token.length, 
      startsWithEy: token.startsWith('ey'),
      hasBearer: authHeader.startsWith('Bearer '),
      sample: token.substring(0, 20) + '...'
    });

    // First, try to decode as JWT (OAuth flow) - only if JWT_SECRET is configured
    if (process.env.JWT_SECRET && token.startsWith('ey')) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        
        req.user = {
          id: decoded.id,
          email: decoded.email,
          access_token: decoded.access_token
        };

        logger.info('Authenticated via JWT token', { userId: decoded.id });
        return next();
      } catch (jwtError) {
        // JWT verification failed, continue to check if it's a Snapchat token
        logger.debug('JWT verification failed, will try as Snapchat token', { error: (jwtError as Error).message });
      }
    }
    
    // Assume it's a Snapchat access token
    // Snapchat tokens can have various formats, so we'll be less restrictive
    // Snapchat Conversions API tokens typically start with patterns like WFIZTM0ZS...
    if (token.length > 20) {
      req.user = {
        id: 'direct_user',
        email: 'direct@api.user',
        access_token: token
      };
      
      logger.info('Authenticated via direct Snapchat token', { 
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10),
        tokenPattern: token.match(/^[A-Za-z0-9]+$/) ? 'alphanumeric' : 'mixed'
      });
      return next();
    }

    logger.warn('Token too short', { tokenLength: token.length });
    return next(new APIError('Invalid token format', 401));
    
  } catch (error) {
    logger.error('Authentication error', { error: (error as Error).message, stack: (error as Error).stack });
    if (error instanceof APIError) {
      return next(error);
    }
    return next(new APIError('Authentication failed', 401));
  }
};