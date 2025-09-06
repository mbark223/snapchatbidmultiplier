import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { CampaignController } from '../controllers/campaignController';

const router = Router();
const campaignController = new CampaignController();

router.use(authenticate);

router.get('/', campaignController.listCampaigns);
router.get('/:id', campaignController.getCampaign);
router.get('/:id/adsquads', campaignController.getCampaignAdSquads);
router.post('/:id/bid-multipliers', campaignController.updateBidMultipliers);

export default router;