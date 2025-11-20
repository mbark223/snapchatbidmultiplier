import { CampaignController } from '../../src/controllers/campaignController';
import { AdSquad } from '../../src/types';

const getAdSquadsMock = jest.fn();

jest.mock('../../src/services/snapchatAPI', () => ({
  SnapchatAPIService: jest.fn().mockImplementation(() => ({
    getAdSquads: getAdSquadsMock
  }))
}));

describe('CampaignController', () => {
  describe('getCampaignAdSquads', () => {
    beforeEach(() => {
      getAdSquadsMock.mockReset();
    });

    it('returns flattened ad squad data', async () => {
      const controller = new CampaignController();
      const adSquads: AdSquad[] = [
        { id: 'ad_1', campaign_id: 'cmp_1', name: 'Ad 1', status: 'ACTIVE' },
        { id: 'ad_2', campaign_id: 'cmp_1', name: 'Ad 2', status: 'PAUSED' }
      ];
      getAdSquadsMock.mockResolvedValue(adSquads);

      const req: any = {
        params: { id: 'cmp_1' },
        user: { access_token: 'token' }
      };
      const json = jest.fn();
      const res: any = { json };
      const next = jest.fn();

      await controller.getCampaignAdSquads(req, res, next);

      expect(json).toHaveBeenCalledWith({
        data: adSquads,
        count: adSquads.length
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
