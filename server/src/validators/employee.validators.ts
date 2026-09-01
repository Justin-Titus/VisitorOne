import { body } from 'express-validator';

export const createEmployeeValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('employeeCode').notEmpty().withMessage('Employee code is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
];

export const updateEmployeeValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
];
