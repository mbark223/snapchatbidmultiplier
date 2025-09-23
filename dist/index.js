"use strict";
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
// Test direct Snapchat API connection
app.get('/debug/test-snapchat', auth_1.authenticate, async (req, res) => {
    const axios = require('axios');
    const token = req.user?.access_token;
    if (!token) {
        return res.status(400).json({ error: 'No access token found' });
    }
    try {
        // Try to fetch user's ad accounts as a simple test
        const response = await axios.get('https://adsapi.snapchat.com/v1/me/adaccounts', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return res.json({
            success: true,
            message: 'Successfully connected to Snapchat API',
            adAccountsCount: response.data.adaccounts?.length || 0,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        return res.json({
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status,
            headers: error.response?.headers,
            timestamp: new Date().toISOString()
        });
    }
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
