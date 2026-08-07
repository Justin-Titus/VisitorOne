const { body } = require('express-validator');

const createEmployeeValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('employeeCode').notEmpty().withMessage('Employee code is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
];

const updateEmployeeValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
];

module.exports = {
  createEmployeeValidator,
  updateEmployeeValidator,
};
