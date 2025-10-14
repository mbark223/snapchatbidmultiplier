import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { APIError } from '../middleware/errorHandler';
import { Campaign, AdSquad, BidMultiplierRequest } from '../types';

export class SnapchatAPIService {
  private client: AxiosInstance;

  constructor(accessToken: string) {
    const baseURL = process.env.SNAPCHAT_API_BASE_URL || 'https://adsapi.snapchat.com/v1';
    const clientId = process.env.SNAPCHAT_CLIENT_ID;
    
    if (!clientId) {
      logger.warn('SNAPCHAT_CLIENT_ID is not configured; Snapchat API calls will fail', {
        hasClientId: !!clientId
      });
    }
    
    logger.info('Initializing Snapchat API client', { 
      baseURL,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length,
      hasClientId: !!clientId
    });
    
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(clientId ? { 'X-Snapchat-Client-Id': clientId } : {})
      },
      timeout: 30000
    });

    // Log requests for debugging
    this.client.interceptors.request.use(
      (config) => {
        // More detailed logging for debugging auth issues
        const authHeader = config.headers?.Authorization as string;
        const tokenSample = authHeader ? authHeader.substring(0, 30) + '...' : 'none';
        
        logger.info('Snapchat API Request', {
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
      const { status, data, headers } = error.response;
      
      // Enhanced error logging
      if (status === 401) {
        logger.error('Authentication failed with Snapchat API', { 
          status, 
          data,
          responseHeaders: headers,
          requestUrl: error.config?.url,
          requestMethod: error.config?.method,
          hasAuthHeader: !!error.config?.headers?.Authorization,
          authHeaderSample: error.config?.headers?.Authorization ? 
            (error.config.headers.Authorization as string).substring(0, 30) + '...' : 'none'
        });
      } else {
        logger.error('Snapchat API Error', { 
          status, 
          data,
          contentType: headers?.['content-type'],
          isHTML: typeof data === 'string' && data.includes('<!DOCTYPE'),
          dataPreview: typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200)
        });
      }
      
      // Extract error message from various possible formats
      let errorMessage = 'Snapchat API Error';
      if (data) {
        if (typeof data === 'object') {
          errorMessage = (data as any).error_message || 
                        (data as any).message || 
                        (data as any).error || 
                        JSON.stringify(data);
        } else {
          errorMessage = String(data);
        }
      }
      
      throw new APIError(errorMessage, status, (data as any)?.errors);
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
        bid_multiplier_properties: bidMultiplierProperties
      }
    });
    return response.data.adsquad;
  }

  async batchUpdateAdSquads(updates: BidMultiplierRequest[]): Promise<AdSquad[]> {
    const adsquads = updates.map(update => ({
      adsquad_id: update.adsquad_id,
      bid_multiplier_properties: update.bid_multiplier_properties
    }));

    const response = await this.client.put('/adsquads/batch', { adsquads });
    return response.data.adsquads;
  }

  async testConnection(): Promise<any> {
    // Snapchat doesn't have a /me endpoint, let's try to get organizations
    const response = await this.client.get('/organizations');
    return response.data;
  }
}
