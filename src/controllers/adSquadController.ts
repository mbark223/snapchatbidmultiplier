import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SnapchatAPIService } from '../services/snapchatAPI';
import { ValidationService } from '../services/validationService';
import { APIError } from '../middleware/errorHandler';
import { MultiplierConfig } from '../types';

export class AdSquadController {
  getAdSquad = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const snapchatAPI = new SnapchatAPIService(req.user!.access_token);
      const adsquad = await snapchatAPI.getAdSquad(id);

      res.json({ data: adsquad });
    } catch (error) {
      next(error);
    }
  };

  getBidMultipliers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const snapchatAPI = new SnapchatAPIService(req.user!.access_token);
      const adsquad = await snapchatAPI.getAdSquad(id);

      if (!adsquad.bid_multiplier_properties) {
        res.json({ 
          data: null,
          message: 'No bid multipliers configured for this ad squad'
        });
        return;
      }

      // Convert back to friendly format
      const multipliers = this.convertFromBidMultiplierMap(
        adsquad.bid_multiplier_properties.bid_multiplier_map,
        adsquad.bid_multiplier_properties.variables
      );

      res.json({ 
        data: {
          multipliers,
          default: adsquad.bid_multiplier_properties.default,
          variables: adsquad.bid_multiplier_properties.variables
        }
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
      const { multipliers, default_multiplier = 1.0 } = req.body;

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

      const updatedAdSquad = await snapchatAPI.updateAdSquadBidMultipliers(id, {
        variables,
        bid_multiplier_map: bidMultiplierMap,
        default: default_multiplier
      });

      res.json({
        data: updatedAdSquad,
        message: 'Bid multipliers updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  removeBidMultipliers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const snapchatAPI = new SnapchatAPIService(req.user!.access_token);
      
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
    } catch (error) {
      next(error);
    }
  };

  private convertFromBidMultiplierMap(
    bidMultiplierMap: Record<string, number>,
    variables: string[]
  ): MultiplierConfig {
    const config: MultiplierConfig = {};

    if (variables.includes('US_STATE')) {
      config.us_state = {};
      Object.entries(bidMultiplierMap).forEach(([key, value]) => {
        if (key.length === 2 && key === key.toUpperCase()) {
          config.us_state![key] = value;
        }
      });
    }

    if (variables.includes('DMA')) {
      config.dma = {};
      Object.entries(bidMultiplierMap).forEach(([key, value]) => {
        if (key.startsWith('DMA_')) {
          config.dma![key] = value;
        }
      });
    }

    return config;
  }
}