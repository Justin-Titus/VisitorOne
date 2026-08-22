const mongoose = require('mongoose');
const { EMPLOYEE_STATUS } = require('../utils/constants');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    employeeCode: { type: String, unique: true, required: true },
    department: { type: String, required: true },
    designation: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(EMPLOYEE_STATUS),
      default: EMPLOYEE_STATUS.ACTIVE,
    },
  },
  { timestamps: true, strict: true }
);

employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ name: 'text', department: 'text', designation: 'text', email: 'text' });

module.exports = mongoose.model('Employee', employeeSchema);
