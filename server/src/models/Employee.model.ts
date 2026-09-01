import mongoose, { Schema } from 'mongoose';
import { EMPLOYEE_STATUS } from '../utils/constants';
import { IEmployee } from '../types';

const employeeSchema = new Schema<IEmployee>(
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
  { timestamps: true, strict: true },
);

employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({
  name: 'text',
  department: 'text',
  designation: 'text',
  email: 'text',
});

const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
export default Employee;
