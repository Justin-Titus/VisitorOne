const express = require('express');
const controller = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(authMiddleware);

router.get('/admin', authorize(ROLES.ADMIN), controller.getAdminDashboard);
router.get('/receptionist', authorize(ROLES.RECEPTIONIST), controller.getReceptionistDashboard);
router.get('/employee', authorize(ROLES.EMPLOYEE), controller.getEmployeeDashboard);

module.exports = router;
