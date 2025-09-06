import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ValidationService } from '../services/validationService';
import { APIError } from '../middleware/errorHandler';
import { DMA, MultiplierConfig } from '../types';
import { dmaData } from '../data/dmas';

export class TargetingController {
  getDMAs = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { state } = req.query;

      let dmas = dmaData;
      
      if (state) {
        dmas = dmas.filter(dma => dma.state === (state as string).toUpperCase());
      }

      res.json({
        data: dmas,
        count: dmas.length
      });
    } catch (error) {
      next(error);
    }
  };

  searchDMAs = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { q } = req.query;

      if (!q) {
        throw new APIError('Search query (q) is required', 400);
      }

      const query = (q as string).toLowerCase();
      const dmas = dmaData.filter(dma => 
        dma.name.toLowerCase().includes(query) ||
        dma.code.toLowerCase().includes(query) ||
        dma.state.toLowerCase().includes(query)
      );

      res.json({
        data: dmas,
        count: dmas.length
      });
    } catch (error) {
      next(error);
    }
  };

  getStates = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const states = [
        { code: 'AL', name: 'Alabama' },
        { code: 'AK', name: 'Alaska' },
        { code: 'AZ', name: 'Arizona' },
        { code: 'AR', name: 'Arkansas' },
        { code: 'CA', name: 'California' },
        { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' },
        { code: 'DE', name: 'Delaware' },
        { code: 'FL', name: 'Florida' },
        { code: 'GA', name: 'Georgia' },
        { code: 'HI', name: 'Hawaii' },
        { code: 'ID', name: 'Idaho' },
        { code: 'IL', name: 'Illinois' },
        { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' },
        { code: 'KS', name: 'Kansas' },
        { code: 'KY', name: 'Kentucky' },
        { code: 'LA', name: 'Louisiana' },
        { code: 'ME', name: 'Maine' },
        { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' },
        { code: 'MI', name: 'Michigan' },
        { code: 'MN', name: 'Minnesota' },
        { code: 'MS', name: 'Mississippi' },
        { code: 'MO', name: 'Missouri' },
        { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' },
        { code: 'NV', name: 'Nevada' },
        { code: 'NH', name: 'New Hampshire' },
        { code: 'NJ', name: 'New Jersey' },
        { code: 'NM', name: 'New Mexico' },
        { code: 'NY', name: 'New York' },
        { code: 'NC', name: 'North Carolina' },
        { code: 'ND', name: 'North Dakota' },
        { code: 'OH', name: 'Ohio' },
        { code: 'OK', name: 'Oklahoma' },
        { code: 'OR', name: 'Oregon' },
        { code: 'PA', name: 'Pennsylvania' },
        { code: 'RI', name: 'Rhode Island' },
        { code: 'SC', name: 'South Carolina' },
        { code: 'SD', name: 'South Dakota' },
        { code: 'TN', name: 'Tennessee' },
        { code: 'TX', name: 'Texas' },
        { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' },
        { code: 'VA', name: 'Virginia' },
        { code: 'WA', name: 'Washington' },
        { code: 'WV', name: 'West Virginia' },
        { code: 'WI', name: 'Wisconsin' },
        { code: 'WY', name: 'Wyoming' },
        { code: 'DC', name: 'District of Columbia' }
      ];

      res.json({ data: states });
    } catch (error) {
      next(error);
    }
  };

  getRegions = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const regions = {
        northeast: {
          name: 'Northeast',
          states: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA']
        },
        midwest: {
          name: 'Midwest',
          states: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD']
        },
        south: {
          name: 'South',
          states: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'DC', 'WV', 'AL', 'KY', 'MS', 'TN', 'AR', 'LA', 'OK', 'TX']
        },
        west: {
          name: 'West',
          states: ['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA']
        }
      };

      res.json({ data: regions });
    } catch (error) {
      next(error);
    }
  };

  validateMultipliers = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { multipliers } = req.body;

      if (!multipliers) {
        throw new APIError('multipliers configuration is required', 400);
      }

      const errors = ValidationService.validateMultiplierConfig(multipliers as MultiplierConfig);

      if (errors.length > 0) {
        res.status(400).json({
          valid: false,
          errors,
          message: 'Validation failed'
        });
      } else {
        res.json({
          valid: true,
          message: 'All multipliers are valid'
        });
      }
    } catch (error) {
      next(error);
    }
  };
}