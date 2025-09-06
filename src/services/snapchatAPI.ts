import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { APIError } from '../middleware/errorHandler';
import { Campaign, AdSquad, BidMultiplierRequest } from '../types';

export class SnapchatAPIService {
  private client: AxiosInstance;

  constructor(accessToken: string) {
    this.client = axios.create({
      baseURL: process.env.SNAPCHAT_API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.client.interceptors.response.use(
      response => response,
      this.handleError
    );
  }

  private handleError = (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      logger.error('Snapchat API Error', { status, data });
      
      throw new APIError(
        data.error_message || 'Snapchat API Error',
        status,
        data.errors
      );
    }
    
    throw new APIError('Network error connecting to Snapchat API', 500);
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