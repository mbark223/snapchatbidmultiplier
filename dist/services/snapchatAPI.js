"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapchatAPIService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
class SnapchatAPIService {
    constructor(accessToken) {
        this.handleError = (error) => {
            if (error.response) {
                const { status, data, headers } = error.response;
                // Enhanced error logging for 401 errors
                if (status === 401) {
                    logger_1.logger.error('Authentication failed with Snapchat API', {
                        status,
                        data,
                        responseHeaders: headers,
                        requestUrl: error.config?.url,
                        requestMethod: error.config?.method,
                        hasAuthHeader: !!error.config?.headers?.Authorization,
                        authHeaderSample: error.config?.headers?.Authorization ?
                            error.config.headers.Authorization.substring(0, 30) + '...' : 'none'
                    });
                }
                else {
                    logger_1.logger.error('Snapchat API Error', { status, data });
                }
                // Extract error message from various possible formats
                let errorMessage = 'Snapchat API Error';
                if (data) {
                    if (typeof data === 'object') {
                        errorMessage = data.error_message ||
                            data.message ||
                            data.error ||
                            JSON.stringify(data);
                    }
                    else {
                        errorMessage = String(data);
                    }
                }
                throw new errorHandler_1.APIError(errorMessage, status, data?.errors);
            }
            // Log network errors with more details
            logger_1.logger.error('Network error connecting to Snapchat API', {
                message: error.message,
                code: error.code,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    baseURL: error.config?.baseURL
                }
            });
            throw new errorHandler_1.APIError(`Network error: ${error.message}`, 500);
        };
        const baseURL = process.env.SNAPCHAT_API_BASE_URL || 'https://adsapi.snapchat.com/v1';
        logger_1.logger.info('Initializing Snapchat API client', {
            baseURL,
            hasToken: !!accessToken,
            tokenLength: accessToken?.length
        });
        this.client = axios_1.default.create({
            baseURL,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        // Log requests for debugging
        this.client.interceptors.request.use((config) => {
            // More detailed logging for debugging auth issues
            const authHeader = config.headers?.Authorization;
            const tokenSample = authHeader ? authHeader.substring(0, 30) + '...' : 'none';
            logger_1.logger.info('Snapchat API Request', {
                url: config.url,
                method: config.method,
                baseURL: config.baseURL,
                fullUrl: `${config.baseURL}${config.url}`,
                hasAuthHeader: !!authHeader,
                authHeaderSample: tokenSample,
                authHeaderLength: authHeader?.length || 0,
                headers: Object.keys(config.headers || {}),
                data: config.data
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Request interceptor error', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => response, this.handleError);
    }
    async getCampaigns(adAccountId) {
        const response = await this.client.get(`/adaccounts/${adAccountId}/campaigns`);
        return response.data.campaigns;
    }
    async getCampaign(campaignId) {
        const response = await this.client.get(`/campaigns/${campaignId}`);
        return response.data.campaign;
    }
    async getAdSquads(campaignId) {
        const response = await this.client.get(`/campaigns/${campaignId}/adsquads`);
        return response.data.adsquads;
    }
    async getAdSquad(adSquadId) {
        const response = await this.client.get(`/adsquads/${adSquadId}`);
        return response.data.adsquad;
    }
    async updateAdSquadBidMultipliers(adSquadId, bidMultiplierProperties) {
        const response = await this.client.put(`/adsquads/${adSquadId}`, {
            adsquad: {
                bid_multiplier_properties: bidMultiplierProperties
            }
        });
        return response.data.adsquad;
    }
    async batchUpdateAdSquads(updates) {
        const adsquads = updates.map(update => ({
            adsquad_id: update.adsquad_id,
            bid_multiplier_properties: update.bid_multiplier_properties
        }));
        const response = await this.client.put('/adsquads/batch', { adsquads });
        return response.data.adsquads;
    }
}
exports.SnapchatAPIService = SnapchatAPIService;
