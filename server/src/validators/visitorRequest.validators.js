const { body, query } = require('express-validator');
const { ID_PROOF_TYPES } = require('../utils/constants');

const createRequestValidator = [
  body('visitorData.name').notEmpty().withMessage('Visitor name is required'),
  body('visitorData.phone').notEmpty().withMessage('Visitor phone is required'),
  body('visitorData.idProofType')
    .optional()
    .isIn(Object.values(ID_PROOF_TYPES))
    .withMessage('Invalid ID proof type'),
  body('employeeToVisit').isMongoId().withMessage('Valid employee ID is required'),
  body('purpose').notEmpty().withMessage('Purpose of visit is required'),
  body('visitDate').isISO8601().toDate().withMessage('Valid visit date is required'),
  body('expectedArrivalTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Expected arrival time must be in HH:mm format'),
];

const rejectRequestValidator = [
  body('remarks').notEmpty().withMessage('Remarks are required when rejecting a request'),
];

const searchValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
];

module.exports = {
  createRequestValidator,
  rejectRequestValidator,
  searchValidator,
};
