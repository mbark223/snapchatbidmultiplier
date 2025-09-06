import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { TargetingController } from '../controllers/targetingController';

const router = Router();
const targetingController = new TargetingController();

router.use(authenticate);

router.get('/dmas', targetingController.getDMAs);
router.get('/dmas/search', targetingController.searchDMAs);
router.get('/states', targetingController.getStates);
router.get('/regions', targetingController.getRegions);
router.post('/validate', targetingController.validateMultipliers);

export default router;