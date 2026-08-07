const express = require('express');
const controller = require('../controllers/user.controller');
const validators = require('../validators/user.validators');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authMiddleware, authorize(ROLES.ADMIN));

router.get('/', controller.getAllUsers);
router.post('/', validators.createUserValidator, validate, controller.createUser);
router.get('/:id', controller.getUserById);
router.put('/:id', validators.updateUserValidator, validate, controller.updateUser);
router.patch('/:id/status', controller.toggleStatus);
router.patch('/:id/reset-password', validators.resetPasswordValidator, validate, controller.resetPassword);

module.exports = router;
