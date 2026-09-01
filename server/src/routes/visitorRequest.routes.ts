import { Router } from 'express';
import * as controller from '../controllers/visitorRequest.controller';
import {
  createRequestValidator,
  rejectRequestValidator,
  searchValidator,
} from '../validators/visitorRequest.validators';
import validate from '../middleware/validate.middleware';
import authMiddleware from '../middleware/auth.middleware';
import authorize from '../middleware/rbac.middleware';
import { ROLES } from '../utils/constants';

const router = Router();

router.use(authMiddleware);

// Global Activity logs (admin only)
router.get('/activity-logs', authorize(ROLES.ADMIN), controller.getGlobalActivityLogs);

// Bulk Operations
router.patch('/bulk-approve', authorize(ROLES.EMPLOYEE, ROLES.ADMIN), controller.bulkApprove);
router.patch('/bulk-reject', authorize(ROLES.EMPLOYEE, ROLES.ADMIN), controller.bulkReject);
router.patch('/bulk-check-in', authorize(ROLES.RECEPTIONIST, ROLES.ADMIN), controller.bulkCheckIn);

router.post('/', authorize(ROLES.RECEPTIONIST), createRequestValidator, validate, controller.create);
router.get('/', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.EMPLOYEE), searchValidator, validate, controller.getAll);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.EMPLOYEE), controller.getById);
router.patch('/:id/approve', authorize(ROLES.EMPLOYEE), controller.approve);
router.patch('/:id/reject', authorize(ROLES.EMPLOYEE), rejectRequestValidator, validate, controller.reject);
router.patch('/:id/remarks', authorize(ROLES.EMPLOYEE), controller.addRemarks);
router.patch('/:id/check-in', authorize(ROLES.RECEPTIONIST), controller.checkIn);
router.patch('/:id/check-out', authorize(ROLES.RECEPTIONIST), controller.checkOut);
router.patch('/:id/cancel', authorize(ROLES.RECEPTIONIST, ROLES.ADMIN), controller.cancel);
router.get('/:id/activity', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.EMPLOYEE), controller.getActivity);

export default router;
