import { Router } from 'express';
import * as controller from '../controllers/user.controller';
import {
  createUserValidator,
  updateUserValidator,
  resetPasswordValidator,
} from '../validators/user.validators';
import validate from '../middleware/validate.middleware';
import authMiddleware from '../middleware/auth.middleware';
import authorize from '../middleware/rbac.middleware';
import { ROLES } from '../utils/constants';

const router = Router();

router.use(authMiddleware, authorize(ROLES.ADMIN));

router.get('/', controller.getAllUsers);
router.post('/', createUserValidator, validate, controller.createUser);
router.get('/:id', controller.getUserById);
router.put('/:id', updateUserValidator, validate, controller.updateUser);
router.patch('/:id/status', controller.toggleStatus);
router.patch('/:id/reset-password', resetPasswordValidator, validate, controller.resetPassword);

export default router;
