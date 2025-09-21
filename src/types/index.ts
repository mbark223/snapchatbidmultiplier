export type TargetingVariable = 'US_STATE' | 'DMA' | 'REGION';


export interface BidMultiplierProperties {
  variables: TargetingVariable[];
  bid_multiplier_map: Record<string, number>;
  default: number;
}

export interface BidMultiplierRequest {
  campaign_id: string;
  adsquad_id: string;
  bid_multiplier_properties: BidMultiplierProperties;
}

export interface MultiplierConfig {
  dma?: Record<string, number>;
  region?: Record<string, number>;
  us_state?: Record<string, number>;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  start_time: string;
  end_time: string;
}

export interface AdSquad {
  id: string;
  campaign_id: string;
  name: string;
  status: string;
  bid_multiplier_properties?: BidMultiplierProperties;
}

export interface DMA {
  code: string;
  name: string;
  state: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  errors?: ValidationError[];
  status: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}