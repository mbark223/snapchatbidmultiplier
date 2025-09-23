import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { APIError } from '../middleware/errorHandler';
import { Campaign, AdSquad, BidMultiplierRequest } from '../types';

export class SnapchatAPIService {
  private client: AxiosInstance;

  constructor(accessToken: string) {
    const baseURL = process.env.SNAPCHAT_API_BASE_URL || 'https://adsapi.snapchat.com/v1';
    
    logger.info('Initializing Snapchat API client', { 
      baseURL,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length 
    });
    
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Log requests for debugging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Snapchat API Request', {
          url: config.url,
          method: config.method,
          baseURL: config.baseURL,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: any) => response,
      this.handleError
    );
  }

  private handleError = (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      logger.error('Snapchat API Error', { status, data });
      
      throw new APIError(
        (data as any).error_message || (data as any).message || 'Snapchat API Error',
        status,
        (data as any).errors
      );
    }
    
    // Log network errors with more details
    logger.error('Network error connecting to Snapchat API', {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
    
    throw new APIError(`Network error: ${error.message}`, 500);
  };

  async getCampaigns(adAccountId: string): Promise<Campaign[]> {
    const response = await this.client.get(`/adaccounts/${adAccountId}/campaigns`);
    return response.data.campaigns;
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await this.client.get(`/campaigns/${campaignId}`);
    return response.data.campaign;
  }

  async getAdSquads(campaignId: string): Promise<AdSquad[]> {
    const response = await this.client.get(`/campaigns/${campaignId}/adsquads`);
    return response.data.adsquads;
  }

  async getAdSquad(adSquadId: string): Promise<AdSquad> {
    const response = await this.client.get(`/adsquads/${adSquadId}`);
    return response.data.adsquad;
  }

  async updateAdSquadBidMultipliers(
    adSquadId: string, 
    bidMultiplierProperties: BidMultiplierRequest['bid_multiplier_properties']
  ): Promise<AdSquad> {
    const response = await this.client.put(`/adsquads/${adSquadId}`, {
      adsquad: {
        brand_safety_config: {
          bid_multiplier_properties: bidMultiplierProperties
        }
      }
    });
    return response.data.adsquad;
  }

  async batchUpdateAdSquads(updates: BidMultiplierRequest[]): Promise<AdSquad[]> {
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