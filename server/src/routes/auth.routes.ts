import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { loginValidator } from '../validators/auth.validators';
import validate from '../middleware/validate.middleware';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.post('/login', loginValidator, validate, authController.login);
router.get('/me', authMiddleware, authController.getMe);

export default router;
