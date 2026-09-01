import { Router } from 'express';
import * as controller from '../controllers/employee.controller';
import {
  createEmployeeValidator,
  updateEmployeeValidator,
} from '../validators/employee.validators';
import validate from '../middleware/validate.middleware';
import authMiddleware from '../middleware/auth.middleware';
import authorize from '../middleware/rbac.middleware';
import { ROLES } from '../utils/constants';

const router = Router();

router.use(authMiddleware);

router.get('/', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.getAllEmployees);
router.post('/', authorize(ROLES.ADMIN), createEmployeeValidator, validate, controller.createEmployee);
router.get('/:id', authorize(ROLES.ADMIN), controller.getEmployeeById);
router.put('/:id', authorize(ROLES.ADMIN), updateEmployeeValidator, validate, controller.updateEmployee);
router.patch('/:id/status', authorize(ROLES.ADMIN), controller.toggleStatus);
router.delete('/:id', authorize(ROLES.ADMIN), controller.deleteEmployee);

export default router;
