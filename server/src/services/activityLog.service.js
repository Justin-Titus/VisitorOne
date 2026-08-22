const ActivityLog = require('../models/ActivityLog.model');
const { escapeRegex } = require('../utils/helpers');

const logActivity = async (visitRequestId, action, performedBy, remarks = '') => {
  const log = new ActivityLog({
    visitRequest: visitRequestId,
    action,
    performedBy,
    remarks,
  });
  await log.save();
  return log;
};

const getActivitiesForRequest = async (visitRequestId) => {
  return await ActivityLog.find({ visitRequest: visitRequestId })
    .populate('performedBy', 'name role')
    .sort({ timestamp: 1 });
};

const getGlobalActivityLogs = async (filters, page = 1, limit = 10) => {
  const query = {};
  if (filters.visitRequestId) query.visitRequest = filters.visitRequestId;
  if (filters.userId) query.performedBy = filters.userId;
  if (filters.action) query.action = filters.action;
  if (filters.from || filters.to) {
    query.timestamp = {};
    if (filters.from) query.timestamp.$gte = new Date(filters.from);
    if (filters.to) query.timestamp.$lte = new Date(filters.to);
  }

  if (filters.search) {
    const User = require('../models/User.model');
    const safeSearch = escapeRegex(filters.search);
    const matchingUsers = await User.find({ name: { $regex: safeSearch, $options: 'i' } }).select('_id');
    const userIds = matchingUsers.map(u => u._id);
    
    query.$or = [
      { remarks: { $regex: safeSearch, $options: 'i' } },
      { action: { $regex: safeSearch, $options: 'i' } }
    ];
    
    if (userIds.length > 0) {
      query.$or.push({ performedBy: { $in: userIds } });
    }
  }

  const skip = (page - 1) * limit;
  const data = await ActivityLog.find(query)
    .populate('visitRequest', 'purpose visitDate status')
    .populate('performedBy', 'name role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await ActivityLog.countDocuments(query);

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  logActivity,
  getActivitiesForRequest,
  getGlobalActivityLogs,
};
