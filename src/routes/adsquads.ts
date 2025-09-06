import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AdSquadController } from '../controllers/adSquadController';

const router = Router();
const adSquadController = new AdSquadController();

router.use(authenticate);

router.get('/:id', adSquadController.getAdSquad);
router.put('/:id/bid-multipliers', adSquadController.updateBidMultipliers);
router.get('/:id/bid-multipliers', adSquadController.getBidMultipliers);
router.delete('/:id/bid-multipliers', adSquadController.removeBidMultipliers);

export default router;