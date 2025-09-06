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
                const { status, data } = error.response;
                logger_1.logger.error('Snapchat API Error', { status, data });
                throw new errorHandler_1.APIError(data.error_message || 'Snapchat API Error', status, data.errors);
            }
            throw new errorHandler_1.APIError('Network error connecting to Snapchat API', 500);
        };
        this.client = axios_1.default.create({
            baseURL: process.env.SNAPCHAT_API_BASE_URL,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
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
                brand_safety_config: {
                    bid_multiplier_properties: bidMultiplierProperties
                }
            }
        });
        return response.data.adsquad;
    }
    async batchUpdateAdSquads(updates) {
        const adsquads = updates.map(update => ({
            adsquad_id: update.adsquad_id,
            brand_safety_config: {
                bid_multiplier_properties: update.bid_multiplier_properties
            }
        }));
        const response = await this.client.put('/adsquads/batch', { adsquads });
        return response.data.adsquads;
    }
}
exports.SnapchatAPIService = SnapchatAPIService;
