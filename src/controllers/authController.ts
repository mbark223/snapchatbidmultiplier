import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { APIError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export class AuthController {
  initiateLogin = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const CLIENT_ID = process.env.SNAPCHAT_CLIENT_ID;
      const REDIRECT_URI = process.env.SNAPCHAT_REDIRECT_URI;
      
      if (!CLIENT_ID || !REDIRECT_URI) {
        logger.error('OAuth config missing', {
          has_client_id: !!CLIENT_ID,
          has_redirect_uri: !!REDIRECT_URI,
          client_id_length: CLIENT_ID?.length || 0,
          env_keys: Object.keys(process.env).filter(k => k.includes('SNAP'))
        });
        throw new APIError('OAuth configuration missing. Please set SNAPCHAT_CLIENT_ID and SNAPCHAT_REDIRECT_URI environment variables.', 500);
      }

      const authUrl = new URL('https://accounts.snapchat.com/login/oauth2/authorize');
      authUrl.searchParams.append('client_id', CLIENT_ID);
      // Force correct redirect URI
      const correctRedirectUri = REDIRECT_URI.includes('/api/auth/callback') 
        ? REDIRECT_URI 
        : REDIRECT_URI.replace('/auth/callback', '/api/auth/callback');
      authUrl.searchParams.append('redirect_uri', correctRedirectUri);
      
      logger.info('OAuth redirect URI:', { redirect_uri: correctRedirectUri });
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', 'snapchat-marketing-api');
      authUrl.searchParams.append('state', this.generateState());

      res.json({ auth_url: authUrl.toString() });
    } catch (error) {
      next(error);
    }
  };

  handleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state } = req.query;

      if (!code) {
        throw new APIError('Authorization code missing', 400);
      }
      
      // In production, validate state parameter to prevent CSRF
      // For now, we'll log it
      logger.info('OAuth callback received', { state });

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code as string);
      
      // Create JWT for our app
      const signOptions: SignOptions = {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      } as SignOptions;
      
      const appToken = jwt.sign(
        {
          id: 'user_id', // In production, get actual user ID
          email: 'user@email.com', // Get from Snapchat user info
          access_token: tokens.access_token
        },
        process.env.JWT_SECRET!,
        signOptions
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || '/';
      const redirectUrl = new URL(frontendUrl, `${req.protocol}://${req.get('host')}`);
      redirectUrl.searchParams.append('token', appToken);
      redirectUrl.searchParams.append('expires_in', tokens.expires_in.toString());
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new APIError('Refresh token required', 400);
      }

      const CLIENT_ID = process.env.SNAPCHAT_CLIENT_ID;
      const CLIENT_SECRET = process.env.SNAPCHAT_CLIENT_SECRET;
      
      if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new APIError('OAuth configuration missing. Please set SNAPCHAT_CLIENT_ID and SNAPCHAT_CLIENT_SECRET environment variables.', 500);
      }
      
      const tokenUrl = 'https://accounts.snapchat.com/login/oauth2/access_token';
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      });
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new APIError(`Failed to refresh token: ${error}`, response.status);
      }
      
      const tokens = await response.json() as OAuthTokenResponse;
      
      // Create new JWT with updated access token
      const signOptions: SignOptions = {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      } as SignOptions;
      
      const appToken = jwt.sign(
        {
          id: 'user_id', // In production, extract from current JWT
          email: 'user@email.com', // Extract from current JWT
          access_token: tokens.access_token
        },
        process.env.JWT_SECRET!,
        signOptions
      );

      res.json({
        token: appToken,
        expires_in: tokens.expires_in
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // In production, invalidate tokens
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
    const CLIENT_ID = process.env.SNAPCHAT_CLIENT_ID;
    const CLIENT_SECRET = process.env.SNAPCHAT_CLIENT_SECRET;
    const REDIRECT_URI = process.env.SNAPCHAT_REDIRECT_URI;
    
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new APIError('OAuth configuration missing. Please set SNAPCHAT_CLIENT_ID, SNAPCHAT_CLIENT_SECRET, and SNAPCHAT_REDIRECT_URI environment variables.', 500);
    }
    
    logger.info('Exchanging code for tokens');
    
    try {
      const tokenUrl = 'https://accounts.snapchat.com/login/oauth2/access_token';
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI.includes('/api/auth/callback') 
          ? REDIRECT_URI 
          : REDIRECT_URI.replace('/auth/callback', '/api/auth/callback')
      });
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new APIError(`Failed to exchange code for tokens: ${error}`, response.status);
      }
      
      const tokens = await response.json() as OAuthTokenResponse;
      return tokens;
    } catch (error) {
      logger.error('Token exchange error:', error);
      throw error;
    }
  }
}