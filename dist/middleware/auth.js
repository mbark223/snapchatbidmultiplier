"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const logger_1 = require("../utils/logger");
const authenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            logger_1.logger.warn('No authorization header provided');
            return next(new errorHandler_1.APIError('No authorization token provided', 401));
        }
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            logger_1.logger.warn('Empty token after removing Bearer prefix');
            return next(new errorHandler_1.APIError('No authorization token provided', 401));
        }
        // Log token info for debugging (without exposing the actual token)
        logger_1.logger.debug('Token info', {
            length: token.length,
            startsWithEy: token.startsWith('ey'),
            hasBearer: authHeader.startsWith('Bearer '),
            sample: token.substring(0, 20) + '...'
        });
        // First, try to decode as JWT (OAuth flow) - only if JWT_SECRET is configured
        if (process.env.JWT_SECRET && token.startsWith('ey')) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    access_token: decoded.access_token
                };
                logger_1.logger.info('Authenticated via JWT token', { userId: decoded.id });
                return next();
            }
            catch (jwtError) {
                // JWT verification failed, continue to check if it's a Snapchat token
                logger_1.logger.debug('JWT verification failed, will try as Snapchat token', { error: jwtError.message });
            }
        }
        // Assume it's a Snapchat access token
        // Snapchat tokens can have various formats, so we'll be less restrictive
        if (token.length > 20) {
            req.user = {
                id: 'direct_user',
                email: 'direct@api.user',
                access_token: token
            };
            logger_1.logger.info('Authenticated via direct Snapchat token', { tokenLength: token.length });
            return next();
        }
        logger_1.logger.warn('Token too short', { tokenLength: token.length });
        return next(new errorHandler_1.APIError('Invalid token format', 401));
    }
    catch (error) {
        logger_1.logger.error('Authentication error', { error: error.message, stack: error.stack });
        if (error instanceof errorHandler_1.APIError) {
            return next(error);
        }
        return next(new errorHandler_1.APIError('Authentication failed', 401));
    }
};
exports.authenticate = authenticate;
