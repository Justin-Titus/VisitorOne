const VisitRequest = require('../models/VisitRequest.model');
const Employee = require('../models/Employee.model');

const getVisitorAnalytics = async (filters = {}) => {
  const { startDate, endDate, department, range, from, to } = filters;
  let matchQuery = {};

  const effectiveStart = startDate || from;
  const effectiveEnd = endDate || to;

  if (range === 'today') {
    const today = new Date().toISOString().split('T')[0];
    matchQuery.visitDateString = today;
  } else if (range === 'week') {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    matchQuery.visitDate = { $gte: startOfWeek };
  } else if (effectiveStart && effectiveEnd) {
    matchQuery.visitDateString = { $gte: effectiveStart, $lte: effectiveEnd };
  } else if (effectiveStart) {
    matchQuery.visitDateString = { $gte: effectiveStart };
  } else if (effectiveEnd) {
    matchQuery.visitDateString = { $lte: effectiveEnd };
  }

  // If department filter is requested, find employee IDs matching that department
  if (department) {
    const matchingEmployees = await Employee.find({
      department: { $regex: department, $options: 'i' },
    }).select('_id');
    const employeeIds = matchingEmployees.map((e) => e._id);
    matchQuery.employeeToVisit = { $in: employeeIds };
  }

  const [statusCounts, totalVisitors, deptBreakdown, hostBreakdown, durationAggr] =
    await Promise.all([
      VisitRequest.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      VisitRequest.countDocuments(matchQuery),
      VisitRequest.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeToVisit',
            foreignField: '_id',
            as: 'emp',
          },
        },
        { $unwind: '$emp' },
        { $group: { _id: '$emp.department', count: { $sum: 1 } } },
        { $project: { department: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      VisitRequest.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeToVisit',
            foreignField: '_id',
            as: 'emp',
          },
        },
        { $unwind: '$emp' },
        { $group: { _id: '$emp.name', count: { $sum: 1 } } },
        { $project: { employeeName: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      VisitRequest.aggregate([
        {
          $match: {
            ...matchQuery,
            status: 'checked_out',
            checkInTime: { $exists: true, $ne: null },
            checkOutTime: { $exists: true, $ne: null },
          },
        },
        {
          $project: {
            durationMs: { $subtract: ['$checkOutTime', '$checkInTime'] },
          },
        },
        { $group: { _id: null, avgDurationMs: { $avg: '$durationMs' } } },
      ]),
    ]);

  const countsMap = statusCounts.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const avgDurationMinutes =
    durationAggr.length > 0 && durationAggr[0].avgDurationMs > 0
      ? parseFloat((durationAggr[0].avgDurationMs / 60000).toFixed(1))
      : 0;

  return {
    summary: {
      total: totalVisitors,
      pending: countsMap.pending || 0,
      approved: countsMap.approved || 0,
      checkedIn: countsMap.checked_in || 0,
      checkedOut: countsMap.checked_out || 0,
      rejected: countsMap.rejected || 0,
      cancelled: countsMap.cancelled || 0,
    },
    countsByStatus: countsMap,
    byDepartment: deptBreakdown,
    byHost: hostBreakdown,
    avgDurationMinutes,
  };
};

module.exports = {
  getVisitorAnalytics,
  getSummaryReport: (range, from, to) => getVisitorAnalytics({ range, from, to }),
};
