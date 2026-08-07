const express = require('express');
const authController = require('../controllers/auth.controller');
const { loginValidator } = require('../validators/auth.validators');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', loginValidator, validate, authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
