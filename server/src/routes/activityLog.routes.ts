import { Router } from 'express';
import * as controller from '../controllers/visitorRequest.controller';
import authMiddleware from '../middleware/auth.middleware';
import authorize from '../middleware/rbac.middleware';
import { ROLES } from '../utils/constants';

const router = Router();
router.use(authMiddleware);

router.get('/', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.getGlobalActivityLogs);

export default router;
