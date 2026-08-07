const { body } = require('express-validator');
const { ROLES } = require('../utils/constants');

const createUserValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(Object.values(ROLES)).withMessage('Invalid role'),
  body('employeeRef').custom((value, { req }) => {
    if (req.body.role === ROLES.EMPLOYEE && !value) {
      throw new Error('Employee reference is required for employee role');
    }
    return true;
  }),
];

const updateUserValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role'),
];

const resetPasswordValidator = [
  body('newPassword').notEmpty().withMessage('New password is required'),
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  resetPasswordValidator,
};
