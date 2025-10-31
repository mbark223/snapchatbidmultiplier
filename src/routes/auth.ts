import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

router.get('/login', authController.initiateLogin);
router.get('/callback', authController.handleCallback);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/token', authController.generateToken);
router.post('/exchange', authController.exchangeToken);

export default router;