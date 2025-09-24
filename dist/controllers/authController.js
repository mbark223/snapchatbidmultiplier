"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class AuthController {
    constructor() {
        this.initiateLogin = async (_req, res, next) => {
            try {
                const CLIENT_ID = process.env.SNAPCHAT_CLIENT_ID;
                const REDIRECT_URI = process.env.SNAPCHAT_REDIRECT_URI;
                if (!CLIENT_ID || !REDIRECT_URI) {
                    throw new errorHandler_1.APIError('OAuth configuration missing. Please set SNAPCHAT_CLIENT_ID and SNAPCHAT_REDIRECT_URI environment variables.', 500);
                }
                const authUrl = new URL('https://accounts.snapchat.com/login/oauth2/authorize');
                authUrl.searchParams.append('client_id', CLIENT_ID);
                // Force correct redirect URI
                const correctRedirectUri = REDIRECT_URI.includes('/api/auth/callback')
                    ? REDIRECT_URI
                    : REDIRECT_URI.replace('/auth/callback', '/api/auth/callback');
                authUrl.searchParams.append('redirect_uri', correctRedirectUri);
                logger_1.logger.info('OAuth redirect URI:', { redirect_uri: correctRedirectUri });
                authUrl.searchParams.append('response_type', 'code');
                authUrl.searchParams.append('scope', 'snapchat-marketing-api');
                authUrl.searchParams.append('state', this.generateState());
                res.json({ auth_url: authUrl.toString() });
            }
            catch (error) {
                next(error);
            }
        };
        this.handleCallback = async (req, res, next) => {
            try {
                const { code, state } = req.query;
                if (!code) {
                    throw new errorHandler_1.APIError('Authorization code missing', 400);
                }
                // In production, validate state parameter to prevent CSRF
                // For now, we'll log it
                logger_1.logger.info('OAuth callback received', { state });
                // Exchange code for tokens
                const tokens = await this.exchangeCodeForTokens(code);
                // Create JWT for our app
                const signOptions = {
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                };
                const appToken = jsonwebtoken_1.default.sign({
                    id: 'user_id', // In production, get actual user ID
                    email: 'user@email.com', // Get from Snapchat user info
                    access_token: tokens.access_token
                }, process.env.JWT_SECRET, signOptions);
                // Redirect to frontend with token
                const frontendUrl = process.env.FRONTEND_URL || '/';
                const redirectUrl = new URL(frontendUrl, `${req.protocol}://${req.get('host')}`);
                redirectUrl.searchParams.append('token', appToken);
                redirectUrl.searchParams.append('expires_in', tokens.expires_in.toString());
                res.redirect(redirectUrl.toString());
            }
            catch (error) {
                next(error);
            }
        };
        this.refreshToken = async (req, res, next) => {
            try {
                const { refresh_token } = req.body;
                if (!refresh_token) {
                    throw new errorHandler_1.APIError('Refresh token required', 400);
                }
                const CLIENT_ID = process.env.SNAPCHAT_CLIENT_ID;
                const CLIENT_SECRET = process.env.SNAPCHAT_CLIENT_SECRET;
                if (!CLIENT_ID || !CLIENT_SECRET) {
                    throw new errorHandler_1.APIError('OAuth configuration missing. Please set SNAPCHAT_CLIENT_ID and SNAPCHAT_CLIENT_SECRET environment variables.', 500);
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
                    throw new errorHandler_1.APIError(`Failed to refresh token: ${error}`, response.status);
                }
                const tokens = await response.json();
                // Create new JWT with updated access token
                const signOptions = {
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                };
                const appToken = jsonwebtoken_1.default.sign({
                    id: 'user_id', // In production, extract from current JWT
                    email: 'user@email.com', // Extract from current JWT
                    access_token: tokens.access_token
                }, process.env.JWT_SECRET, signOptions);
                res.json({
                    token: appToken,
                    expires_in: tokens.expires_in
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.logout = async (_req, res, next) => {
            try {
                // In production, invalidate tokens
                res.json({ message: 'Logged out successfully' });
            }
            catch (error) {
                next(error);
            }
        };
    }
    generateState() {
        return Math.random().toString(36).substring(2, 15);
    }
    async exchangeCodeForTokens(code) {
        const CLIENT_ID = process.env.SNAPCHAT_CLIENT_ID;
        const CLIENT_SECRET = process.env.SNAPCHAT_CLIENT_SECRET;
        const REDIRECT_URI = process.env.SNAPCHAT_REDIRECT_URI;
        if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
            throw new errorHandler_1.APIError('OAuth configuration missing. Please set SNAPCHAT_CLIENT_ID, SNAPCHAT_CLIENT_SECRET, and SNAPCHAT_REDIRECT_URI environment variables.', 500);
        }
        logger_1.logger.info('Exchanging code for tokens');
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
                throw new errorHandler_1.APIError(`Failed to exchange code for tokens: ${error}`, response.status);
            }
            const tokens = await response.json();
            return tokens;
        }
        catch (error) {
            logger_1.logger.error('Token exchange error:', error);
            throw error;
        }
    }
}
exports.AuthController = AuthController;
