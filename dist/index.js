"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const logger_1 = require("./utils/logger");
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const adsquads_1 = __importDefault(require("./routes/adsquads"));
const targeting_1 = __importDefault(require("./routes/targeting"));
const auth_2 = __importDefault(require("./routes/auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Ensure Express respects X-Forwarded-* headers behind proxies (Vercel, etc.)
app.set('trust proxy', 1);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(limiter);
// Serve static files from public directory
const publicPath = path_1.default.join(__dirname, '..', 'public');
app.use(express_1.default.static(publicPath));
app.use('/api/auth', auth_2.default);
app.use('/api/campaigns', campaigns_1.default);
app.use('/api/adsquads', adsquads_1.default);
app.use('/api/targeting', targeting_1.default);
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Debug endpoint to check auth header
app.get('/debug/auth', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    res.json({
        hasAuthHeader: !!authHeader,
        authHeader: authHeader ? 'Bearer ...' : 'none',
        headerLength: authHeader?.length || 0,
        tokenLength: token?.length || 0,
        startsWithBearer: authHeader?.startsWith('Bearer '),
        tokenStartsWith: token ? token.substring(0, 20) + '...' : 'none',
        hasJwtSecret: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET?.length || 0,
        allHeaders: Object.keys(req.headers),
        timestamp: new Date().toISOString()
    });
});
// Test the actual auth middleware
app.get('/debug/test-auth', auth_1.authenticate, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user,
        timestamp: new Date().toISOString()
    });
});
// Simple test endpoint - no auth required
app.get('/debug/test-config', (_req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        config: {
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasSnapchatClientId: !!process.env.SNAPCHAT_CLIENT_ID,
            hasSnapchatClientSecret: !!process.env.SNAPCHAT_CLIENT_SECRET,
            apiBaseUrl: process.env.SNAPCHAT_API_BASE_URL || 'https://adsapi.snapchat.com/v1',
            nodeEnv: process.env.NODE_ENV || 'development'
        }
    });
});
// Test Snapchat API connection
app.get('/debug/test-snapchat', auth_1.authenticate, async (req, res) => {
    try {
        const { SnapchatAPIService } = await Promise.resolve().then(() => __importStar(require('./services/snapchatAPI')));
        const snapchatAPI = new SnapchatAPIService(req.user.access_token);
        // Try to get user info from Snapchat
        const response = await snapchatAPI.testConnection();
        res.json({
            success: true,
            message: 'Successfully connected to Snapchat API',
            data: response.data
        });
    }
    catch (error) {
        res.status(error.response?.status || 500).json({
            success: false,
            message: 'Failed to connect to Snapchat API',
            error: error.response?.data || error.message,
            status: error.response?.status
        });
    }
});
// Test with custom URL
app.post('/debug/test-url', auth_1.authenticate, async (req, res) => {
    try {
        const { url } = req.body;
        const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${req.user.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        res.json({
            success: true,
            data: response.data,
            headers: response.headers
        });
    }
    catch (error) {
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status,
            contentType: error.response?.headers?.['content-type'],
            isHTML: typeof error.response?.data === 'string' && error.response?.data.includes('<!DOCTYPE')
        });
    }
});
// Test specific ad squad
app.get('/debug/test-adsquad/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { SnapchatAPIService } = await Promise.resolve().then(() => __importStar(require('./services/snapchatAPI')));
        const snapchatAPI = new SnapchatAPIService(req.user.access_token);
        logger_1.logger.info('Testing ad squad fetch', {
            adSquadId: req.params.id,
            tokenLength: req.user.access_token.length,
            tokenPreview: req.user.access_token.substring(0, 20) + '...'
        });
        const adSquad = await snapchatAPI.getAdSquad(req.params.id);
        res.json({
            success: true,
            message: 'Successfully fetched ad squad',
            data: adSquad
        });
    }
    catch (error) {
        logger_1.logger.error('Ad squad fetch failed', {
            error: error.response?.data || error.message,
            status: error.response?.status,
            adSquadId: req.params.id
        });
        res.status(error.response?.status || 500).json({
            success: false,
            message: 'Failed to fetch ad squad from Snapchat',
            error: error.response?.data || error.message,
            status: error.response?.status,
            details: {
                adSquadId: req.params.id,
                errorType: error.response?.data?.error_code || 'unknown',
                suggestion: error.response?.status === 404 ?
                    'Ad Squad ID not found. Please verify the ID is correct and belongs to your account.' :
                    'Please check your access token has permissions for this ad account.'
            }
        });
    }
});
// Test direct Snapchat API connection
app.get('/debug/test-snapchat', auth_1.authenticate, async (req, res) => {
    const axios = require('axios');
    const token = req.user?.access_token;
    if (!token) {
        return res.status(400).json({ error: 'No access token found. Make sure you completed the OAuth flow or are using a valid Snapchat access token.' });
    }
    const results = {};
    // Test 1: Try to fetch user's ad accounts
    try {
        const response = await axios.get('https://adsapi.snapchat.com/v1/me/adaccounts', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        results.adAccounts = {
            success: true,
            count: response.data.adaccounts?.length || 0
        };
    }
    catch (error) {
        results.adAccounts = {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
    // Test 2: Try to fetch the specific ad squad if adSquadId is provided
    const adSquadId = req.query.adSquadId || 'bb019d2b-f960-47a6-b0a7-4485736d11e0'; // Using the ID from your tests
    try {
        const response = await axios.get(`https://adsapi.snapchat.com/v1/adsquads/${adSquadId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        results.adSquad = {
            success: true,
            data: response.data.adsquad ? {
                id: response.data.adsquad.id,
                name: response.data.adsquad.name,
                status: response.data.adsquad.status,
                has_bid_multipliers: !!response.data.adsquad.bid_multiplier_properties
            } : null
        };
    }
    catch (error) {
        results.adSquad = {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
    // Test 3: Get user info
    try {
        const response = await axios.get('https://adsapi.snapchat.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        results.userInfo = {
            success: true,
            data: response.data.me
        };
    }
    catch (error) {
        results.userInfo = {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
    return res.json({
        success: results.adAccounts?.success || results.adSquad?.success || results.userInfo?.success,
        results,
        timestamp: new Date().toISOString()
    });
});
// Test endpoint for direct Snapchat access tokens (for testing only)
app.post('/debug/test-snapchat-direct', async (req, res) => {
    const axios = require('axios');
    const { access_token, ad_squad_id } = req.body;
    if (!access_token) {
        return res.status(400).json({ error: 'Please provide access_token in request body' });
    }
    const results = {};
    // Test 1: Try to fetch user info
    try {
        const response = await axios.get('https://adsapi.snapchat.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });
        results.userInfo = {
            success: true,
            data: response.data.me
        };
    }
    catch (error) {
        results.userInfo = {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
    // Test 2: Try to fetch ad accounts
    try {
        const response = await axios.get('https://adsapi.snapchat.com/v1/me/adaccounts', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });
        results.adAccounts = {
            success: true,
            count: response.data.adaccounts?.length || 0
        };
    }
    catch (error) {
        results.adAccounts = {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status
        };
    }
    // Test 3: Try to fetch specific ad squad if provided
    if (ad_squad_id) {
        try {
            const response = await axios.get(`https://adsapi.snapchat.com/v1/adsquads/${ad_squad_id}`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                }
            });
            results.adSquad = {
                success: true,
                data: {
                    name: response.data.adsquads?.[0]?.adsquad?.name,
                    status: response.data.adsquads?.[0]?.adsquad?.status,
                    has_bid_multipliers: !!response.data.adsquads?.[0]?.adsquad?.bid_multiplier_properties
                }
            };
        }
        catch (error) {
            results.adSquad = {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status
            };
        }
    }
    return res.json({
        success: results.userInfo?.success || results.adAccounts?.success || results.adSquad?.success,
        results,
        note: 'This is a test endpoint for direct Snapchat access tokens',
        timestamp: new Date().toISOString()
    });
});
// Debug endpoint for environment variables
app.get('/debug/env', (_req, res) => {
    res.json({
        has_client_id: !!process.env.SNAPCHAT_CLIENT_ID,
        has_client_secret: !!process.env.SNAPCHAT_CLIENT_SECRET,
        has_redirect_uri: !!process.env.SNAPCHAT_REDIRECT_URI,
        has_jwt_secret: !!process.env.JWT_SECRET,
        redirect_uri_value: process.env.SNAPCHAT_REDIRECT_URI || 'NOT SET',
        node_env: process.env.NODE_ENV,
        vercel: process.env.VERCEL,
        timestamp: new Date().toISOString()
    });
});
// Serve index.html for root route
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
app.use(errorHandler_1.errorHandler);
// For Vercel deployment
if (process.env.VERCEL) {
    // Export for Vercel
    module.exports = app;
}
else {
    // Local development
    app.listen(PORT, () => {
        logger_1.logger.info(`Server is running on port ${PORT}`);
    });
}
exports.default = app;
