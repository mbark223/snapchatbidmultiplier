"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdSquadController = void 0;
const snapchatAPI_1 = require("../services/snapchatAPI");
const validationService_1 = require("../services/validationService");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
class AdSquadController {
    constructor() {
        this.getAdSquad = async (req, res, next) => {
            try {
                const { id } = req.params;
                const snapchatAPI = new snapchatAPI_1.SnapchatAPIService(req.user.access_token);
                const adsquad = await snapchatAPI.getAdSquad(id);
                res.json({ data: adsquad });
            }
            catch (error) {
                next(error);
            }
        };
        this.getBidMultipliers = async (req, res, next) => {
            try {
                const { id } = req.params;
                const snapchatAPI = new snapchatAPI_1.SnapchatAPIService(req.user.access_token);
                const adsquad = await snapchatAPI.getAdSquad(id);
                if (!adsquad.bid_multiplier_properties) {
                    res.json({
                        data: null,
                        message: 'No bid multipliers configured for this ad squad'
                    });
                    return;
                }
                // Convert back to friendly format
                const multipliers = this.convertFromBidMultiplierMap(adsquad.bid_multiplier_properties.bid_multiplier_map, adsquad.bid_multiplier_properties.variables);
                res.json({
                    data: {
                        multipliers,
                        default: adsquad.bid_multiplier_properties.default,
                        variables: adsquad.bid_multiplier_properties.variables
                    }
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.updateBidMultipliers = async (req, res, next) => {
            const { id } = req.params;
            try {
                const { multipliers, default_multiplier = 1.0 } = req.body;
                if (!multipliers) {
                    throw new errorHandler_1.APIError('multipliers configuration is required', 400);
                }
                // Validate multiplier configuration
                const validationErrors = validationService_1.ValidationService.validateMultiplierConfig(multipliers);
                if (validationErrors.length > 0) {
                    throw new errorHandler_1.APIError('Validation failed', 400, validationErrors);
                }
                const snapchatAPI = new snapchatAPI_1.SnapchatAPIService(req.user.access_token);
                // Convert to Snapchat API format
                const bidMultiplierMap = validationService_1.ValidationService.convertToBidMultiplierMap(multipliers);
                const variables = validationService_1.ValidationService.getTargetingVariables(multipliers);
                const updatedAdSquad = await snapchatAPI.updateAdSquadBidMultipliers(id, {
                    variables,
                    bid_multiplier_map: bidMultiplierMap,
                    default: default_multiplier
                });
                res.json({
                    data: updatedAdSquad,
                    message: 'Bid multipliers updated successfully'
                });
            }
            catch (error) {
                logger_1.logger.error('Error updating bid multipliers', {
                    adSquadId: id,
                    error: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    stack: error.stack
                });
                // If it's an Axios error with response data, provide more details
                if (error.response?.data) {
                    const snapchatError = error.response.data;
                    next(new errorHandler_1.APIError(`Snapchat API Error: ${snapchatError.error || snapchatError.message || JSON.stringify(snapchatError)}`, error.response.status));
                }
                else {
                    next(error);
                }
            }
        };
        this.removeBidMultipliers = async (req, res, next) => {
            try {
                const { id } = req.params;
                const snapchatAPI = new snapchatAPI_1.SnapchatAPIService(req.user.access_token);
                // Remove by setting empty configuration
                const updatedAdSquad = await snapchatAPI.updateAdSquadBidMultipliers(id, {
                    variables: [],
                    bid_multiplier_map: {},
                    default: 1.0
                });
                res.json({
                    data: updatedAdSquad,
                    message: 'Bid multipliers removed successfully'
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
    convertFromBidMultiplierMap(bidMultiplierMap, variables) {
        const config = {};
        if (variables.includes('US_STATE')) {
            config.us_state = {};
            Object.entries(bidMultiplierMap).forEach(([key, value]) => {
                if (key.length === 2 && key === key.toUpperCase()) {
                    config.us_state[key] = value;
                }
            });
        }
        if (variables.includes('DMA')) {
            config.dma = {};
            Object.entries(bidMultiplierMap).forEach(([key, value]) => {
                if (key.startsWith('DMA_')) {
                    config.dma[key] = value;
                }
            });
        }
        return config;
    }
}
exports.AdSquadController = AdSquadController;
