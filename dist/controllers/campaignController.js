"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignController = void 0;
const snapchatAPI_1 = require("../services/snapchatAPI");
const validationService_1 = require("../services/validationService");
const errorHandler_1 = require("../middleware/errorHandler");
class CampaignController {
    constructor() {
        this.listCampaigns = async (req, res, next) => {
            try {
                const { ad_account_id } = req.query;
                if (!ad_account_id) {
                    throw new errorHandler_1.APIError('ad_account_id is required', 400);
                }
                const snapchatAPI = new snapchatAPI_1.SnapchatAPIService(req.user.access_token);
                const campaigns = await snapchatAPI.getCampaigns(ad_account_id);
                res.json({
                    data: campaigns,
                    count: campaigns.length
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getCampaign = async (req, res, next) => {
            try {
                const { id } = req.params;
                const snapchatAPI = new snapchatAPI_1.SnapchatAPIService(req.user.access_token);
                const campaign = await snapchatAPI.getCampaign(id);
                res.json({ data: campaign });
            }
            catch (error) {
                next(error);
            }
        };
        this.getCampaignAdSquads = async (req, res, next) => {
            try {
                const { id } = req.params;
                const snapchatAPI = new snapchatAPI_1.SnapchatAPIService(req.user.access_token);
                const adsquads = await snapchatAPI.getAdSquads(id);
                res.json({
                    data: adsquads,
                    count: adsquads.length
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.updateBidMultipliers = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { adsquad_ids, multipliers, default_multiplier = 1.0 } = req.body;
                if (!adsquad_ids || !Array.isArray(adsquad_ids) || adsquad_ids.length === 0) {
                    throw new errorHandler_1.APIError('adsquad_ids array is required', 400);
                }
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
                // Prepare batch update
                const updates = adsquad_ids.map((adsquad_id) => ({
                    campaign_id: id,
                    adsquad_id,
                    bid_multiplier_properties: {
                        variables,
                        bid_multiplier_map: bidMultiplierMap,
                        default: default_multiplier
                    }
                }));
                const updatedAdSquads = await snapchatAPI.batchUpdateAdSquads(updates);
                res.json({
                    data: updatedAdSquads,
                    message: `Successfully updated ${updatedAdSquads.length} ad squads`
                });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.CampaignController = CampaignController;
