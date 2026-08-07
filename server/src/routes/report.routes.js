const express = require('express');
const controller = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(authMiddleware);

router.get('/visitor-analytics', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.getVisitorAnalytics);
router.get('/summary', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.getSummary);

module.exports = router;
