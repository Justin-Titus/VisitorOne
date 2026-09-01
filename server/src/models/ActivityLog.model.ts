import mongoose, { Schema } from 'mongoose';
import { ACTIVITY_ACTIONS } from '../utils/constants';
import { IActivityLog } from '../types';

const activityLogSchema = new Schema<IActivityLog>(
  {
    visitRequest: { type: Schema.Types.ObjectId, ref: 'VisitRequest', required: true },
    action: { type: String, enum: Object.values(ACTIVITY_ACTIONS), required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: true },
);

activityLogSchema.index({ visitRequest: 1, timestamp: -1 });
activityLogSchema.index({ performedBy: 1, timestamp: -1 });

const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
export default ActivityLog;
