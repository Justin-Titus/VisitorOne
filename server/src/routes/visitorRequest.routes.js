const express = require('express');
const controller = require('../controllers/visitorRequest.controller');
const validators = require('../validators/visitorRequest.validators');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware);

// Global Activity logs (admin only)
router.get('/activity-logs', authorize(ROLES.ADMIN), controller.getGlobalActivityLogs);

router.post(
  '/',
  authorize(ROLES.RECEPTIONIST),
  validators.createRequestValidator,
  validate,
  controller.create
);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.EMPLOYEE),
  validators.searchValidator,
  validate,
  controller.getAll
);

router.get(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.EMPLOYEE),
  controller.getById
);

router.patch(
  '/:id/approve',
  authorize(ROLES.EMPLOYEE),
  controller.approve
);

router.patch(
  '/:id/reject',
  authorize(ROLES.EMPLOYEE),
  validators.rejectRequestValidator,
  validate,
  controller.reject
);

router.patch(
  '/:id/remarks',
  authorize(ROLES.EMPLOYEE),
  controller.addRemarks
);

router.patch(
  '/:id/check-in',
  authorize(ROLES.RECEPTIONIST),
  controller.checkIn
);

router.patch(
  '/:id/check-out',
  authorize(ROLES.RECEPTIONIST),
  controller.checkOut
);

router.patch(
  '/:id/cancel',
  authorize(ROLES.RECEPTIONIST, ROLES.ADMIN),
  controller.cancel
);

router.get(
  '/:id/activity',
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.EMPLOYEE),
  controller.getActivity
);

module.exports = router;
