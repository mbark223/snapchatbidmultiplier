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
const logger_1 = require("./utils/logger");
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const adsquads_1 = __importDefault(require("./routes/adsquads"));
const targeting_1 = __importDefault(require("./routes/targeting"));
const auth_1 = __importDefault(require("./routes/auth"));
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
app.use(express_1.default.static('public'));
app.use('/api/auth', auth_1.default);
app.use('/api/campaigns', campaigns_1.default);
app.use('/api/adsquads', adsquads_1.default);
app.use('/api/targeting', targeting_1.default);
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Serve index.html for root route
app.get('/', (_req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'public', 'index.html'));
});
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
});
