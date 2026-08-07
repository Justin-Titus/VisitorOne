const express = require('express');
const controller = require('../controllers/visitorRequest.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();
router.use(authMiddleware);

router.get('/', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), controller.getGlobalActivityLogs);

module.exports = router;
