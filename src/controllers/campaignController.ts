import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SnapchatAPIService } from '../services/snapchatAPI';
import { ValidationService } from '../services/validationService';
import { APIError } from '../middleware/errorHandler';
import { MultiplierConfig } from '../types';

export class CampaignController {
  listCampaigns = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { ad_account_id } = req.query;
      
      if (!ad_account_id) {
        throw new APIError('ad_account_id is required', 400);
      }

      const snapchatAPI = new SnapchatAPIService(req.user!.access_token);
      const campaigns = await snapchatAPI.getCampaigns(ad_account_id as string);

      res.json({
        data: campaigns,
        count: campaigns.length
      });
    } catch (error) {
      next(error);
    }
  };

  getCampaign = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const snapchatAPI = new SnapchatAPIService(req.user!.access_token);
      const campaign = await snapchatAPI.getCampaign(id);

      res.json({ data: campaign });
    } catch (error) {
      next(error);
    }
  };

  getCampaignAdSquads = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const snapchatAPI = new SnapchatAPIService(req.user!.access_token);
      const adsquads = await snapchatAPI.getAdSquads(id);

      res.json({
        data: adsquads,
        count: adsquads.length
      });
    } catch (error) {
      next(error);
    }
  };

  updateBidMultipliers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { adsquad_ids, multipliers, default_multiplier = 1.0 } = req.body;

      if (!adsquad_ids || !Array.isArray(adsquad_ids) || adsquad_ids.length === 0) {
        throw new APIError('adsquad_ids array is required', 400);
      }

      if (!multipliers) {
        throw new APIError('multipliers configuration is required', 400);
      }

      // Validate multiplier configuration
      const validationErrors = ValidationService.validateMultiplierConfig(multipliers as MultiplierConfig);
      if (validationErrors.length > 0) {
        throw new APIError('Validation failed', 400, validationErrors);
      }

      const snapchatAPI = new SnapchatAPIService(req.user!.access_token);
      
      // Convert to Snapchat API format
      const bidMultiplierMap = ValidationService.convertToBidMultiplierMap(multipliers);
      const variables = ValidationService.getTargetingVariables(multipliers);

      // Prepare batch update
      const updates = adsquad_ids.map((adsquad_id: string) => ({
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
        updated: updatedAdSquads.length,
        message: `Successfully updated ${updatedAdSquads.length} ad squads`
      });
    } catch (error) {
      next(error);
    }
  };
}
