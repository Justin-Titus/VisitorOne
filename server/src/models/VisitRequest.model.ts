import mongoose, { Schema } from 'mongoose';
import { VISIT_STATUS } from '../utils/constants';
import { IVisitRequest } from '../types';

const visitRequestSchema = new Schema<IVisitRequest>(
  {
    visitor: { type: Schema.Types.ObjectId, ref: 'Visitor', required: true },
    employeeToVisit: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    purpose: { type: String, required: true },
    visitDate: { type: Date, required: true },
    visitDateString: { type: String, required: true }, // YYYY-MM-DD
    expectedArrivalTime: { type: String, required: true }, // HH:mm
    status: {
      type: String,
      enum: Object.values(VISIT_STATUS),
      default: VISIT_STATUS.PENDING,
    },
    remarks: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
  },
  { timestamps: true, strict: true },
);

visitRequestSchema.index({ visitor: 1, visitDateString: 1 }, { unique: true });
visitRequestSchema.index({ employeeToVisit: 1, status: 1 });
visitRequestSchema.index({ status: 1, visitDate: -1 });
visitRequestSchema.index({ visitDate: -1, createdAt: -1 });
visitRequestSchema.index({ visitDateString: 1, status: 1 });
visitRequestSchema.index({ employeeToVisit: 1, visitDate: -1 });
visitRequestSchema.index({ status: 1, visitDateString: 1, employeeToVisit: 1 });
visitRequestSchema.index({ visitor: 1, status: 1 });
visitRequestSchema.index({ createdBy: 1, createdAt: -1 });

const VisitRequest = mongoose.model<IVisitRequest>('VisitRequest', visitRequestSchema);
export default VisitRequest;
