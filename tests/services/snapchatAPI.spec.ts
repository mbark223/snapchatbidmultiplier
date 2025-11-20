import axios from 'axios';
import { SnapchatAPIService } from '../../src/services/snapchatAPI';
import { AdSquad, Campaign } from '../../src/types';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

const buildCampaign = (id: string): Campaign => ({
  id,
  name: `Campaign ${id}`,
  status: 'ACTIVE',
  budget: 100,
  start_time: '2024-01-01T00:00:00Z',
  end_time: '2024-12-31T00:00:00Z'
});

const buildAdSquad = (id: string): AdSquad => ({
  id,
  campaign_id: 'cmp_1',
  name: `AdSquad ${id}`,
  status: 'ACTIVE'
});

const setupAxiosClient = () => {
  const get = jest.fn();
  const put = jest.fn();
  const requestUse = jest.fn();
  const responseUse = jest.fn();

  mockedAxios.create.mockReturnValue({
    get,
    put,
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse }
    }
  } as any);

  return { get, put };
};

describe('SnapchatAPIService response normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flattens nested campaign responses', async () => {
    const { get } = setupAxiosClient();
    const campaignOne = buildCampaign('cmp_1');
    const campaignTwo = buildCampaign('cmp_2');
    get.mockResolvedValue({
      data: {
        campaigns: [
          { campaign: campaignOne },
          { campaign: campaignTwo }
        ]
      }
    });

    const service = new SnapchatAPIService('test-token');
    const campaigns = await service.getCampaigns('acct_1');

    expect(campaigns).toEqual([campaignOne, campaignTwo]);
    expect(get).toHaveBeenCalledWith('/adaccounts/acct_1/campaigns');
  });

  it('flattens nested adsquad responses', async () => {
    const { get } = setupAxiosClient();
    const adOne = buildAdSquad('ad_1');
    const adTwo = buildAdSquad('ad_2');
    get.mockResolvedValue({
      data: {
        adsquads: [
          { adsquad: adOne },
          { adsquad: adTwo }
        ]
      }
    });

    const service = new SnapchatAPIService('test-token');
    const adsquads = await service.getAdSquads('cmp_1');

    expect(adsquads).toEqual([adOne, adTwo]);
    expect(get).toHaveBeenCalledWith('/campaigns/cmp_1/adsquads');
  });

  it('returns a single entity when Snapchat responds with root level data', async () => {
    const { get } = setupAxiosClient();
    const campaign = buildCampaign('cmp_3');
    get.mockResolvedValue({
      data: {
        campaign
      }
    });

    const service = new SnapchatAPIService('test-token');
    const result = await service.getCampaign('cmp_3');

    expect(result).toEqual(campaign);
    expect(get).toHaveBeenCalledWith('/campaigns/cmp_3');
  });
});
