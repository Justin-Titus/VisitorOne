const mongoose = require('mongoose');
const { ACTIVITY_ACTIONS } = require('../utils/constants');

const activityLogSchema = new mongoose.Schema(
  {
    visitRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitRequest', required: true },
    action: { type: String, enum: Object.values(ACTIVITY_ACTIONS), required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remarks: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
