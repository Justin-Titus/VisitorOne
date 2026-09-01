import { Router } from 'express';
import * as controller from '../controllers/report.controller';
import authMiddleware from '../middleware/auth.middleware';
import authorize from '../middleware/rbac.middleware';
import { ROLES } from '../utils/constants';

const router = Router();
router.use(authMiddleware);

router.get('/visitor-analytics', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.getVisitorAnalytics);
router.get('/summary', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.getSummary);
router.get('/export/pdf', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.exportPdf);
router.get('/export/excel', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.exportExcel);

export default router;
