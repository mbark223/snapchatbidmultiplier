"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.APIError = void 0;
const logger_1 = require("../utils/logger");
class APIError extends Error {
    constructor(message, statusCode = 500, errors) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'APIError';
    }
}
exports.APIError = APIError;
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const statusCode = err instanceof APIError ? err.statusCode : 500;
    const message = err.message || 'Internal Server Error';
    const errors = err instanceof APIError ? err.errors : undefined;
    logger_1.logger.error({
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
exports.errorHandler = errorHandler;
