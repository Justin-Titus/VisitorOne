const express = require('express');
const controller = require('../controllers/employee.controller');
const validators = require('../validators/employee.validators');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.getAllEmployees);
router.post('/', authorize(ROLES.ADMIN), validators.createEmployeeValidator, validate, controller.createEmployee);
router.get('/:id', authorize(ROLES.ADMIN), controller.getEmployeeById);
router.put('/:id', authorize(ROLES.ADMIN), validators.updateEmployeeValidator, validate, controller.updateEmployee);
router.patch('/:id/status', authorize(ROLES.ADMIN), controller.toggleStatus);
router.delete('/:id', authorize(ROLES.ADMIN), controller.deleteEmployee);

module.exports = router;
