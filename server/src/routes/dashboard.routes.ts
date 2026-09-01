import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller';
import authMiddleware from '../middleware/auth.middleware';
import authorize from '../middleware/rbac.middleware';
import { ROLES } from '../utils/constants';

const router = Router();
router.use(authMiddleware);

router.get('/admin', authorize(ROLES.ADMIN), controller.getAdminDashboard);
router.get('/receptionist', authorize(ROLES.RECEPTIONIST), controller.getReceptionistDashboard);
router.get('/employee', authorize(ROLES.EMPLOYEE), controller.getEmployeeDashboard);

export default router;
