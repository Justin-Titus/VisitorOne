const VisitRequest = require('../models/VisitRequest.model');
const Employee = require('../models/Employee.model');
const Visitor = require('../models/Visitor.model');
const User = require('../models/User.model');
const { VISIT_STATUS, EMPLOYEE_STATUS } = require('../utils/constants');

const getAdminDashboard = async () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalVisitors,
    totalUsers,
    checkedInVisitors,
    pendingRequests,
    todaysVisitors,
    weeklyTotal,
    totalEmployees,
  ] = await Promise.all([
    Visitor.countDocuments({}),
    User.countDocuments({}),
    VisitRequest.countDocuments({ status: VISIT_STATUS.CHECKED_IN }),
    VisitRequest.countDocuments({ status: VISIT_STATUS.PENDING }),
    VisitRequest.countDocuments({ visitDateString: todayStr, status: { $ne: VISIT_STATUS.CANCELLED } }),
    VisitRequest.countDocuments({ visitDate: { $gte: startOfWeek }, status: { $ne: VISIT_STATUS.CANCELLED } }),
    Employee.countDocuments({ status: EMPLOYEE_STATUS.ACTIVE }),
  ]);

  return {
    totalVisitors,
    totalUsers,
    checkedInVisitors,
    pendingRequests,
    todaysVisitors,
    weeklyTotal,
    totalEmployees,
    currentlyInside: checkedInVisitors,
  };
};

const getReceptionistDashboard = async () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [
    todaysScheduled,
    currentlyInside,
    pendingCheckIns
  ] = await Promise.all([
    VisitRequest.countDocuments({ visitDateString: todayStr, status: { $ne: VISIT_STATUS.CANCELLED } }),
    VisitRequest.countDocuments({ status: VISIT_STATUS.CHECKED_IN }),
    VisitRequest.countDocuments({ visitDateString: todayStr, status: VISIT_STATUS.APPROVED })
  ]);

  return { todaysScheduled, currentlyInside, pendingCheckIns };
};

const getEmployeeDashboard = async (employeeRef) => {
  const [
    pendingCount,
    checkedInCount,
    totalHandled
  ] = await Promise.all([
    VisitRequest.countDocuments({ employeeToVisit: employeeRef, status: VISIT_STATUS.PENDING }),
    VisitRequest.countDocuments({ employeeToVisit: employeeRef, status: VISIT_STATUS.CHECKED_IN }),
    VisitRequest.countDocuments({
      employeeToVisit: employeeRef,
      status: { $in: [VISIT_STATUS.APPROVED, VISIT_STATUS.CHECKED_IN, VISIT_STATUS.CHECKED_OUT, VISIT_STATUS.REJECTED] },
    }),
  ]);

  return {
    pendingCount,
    checkedInCount,
    totalHandled,
    myPendingRequests: pendingCount,
    myUpcomingVisitors: checkedInCount,
    myVisitHistoryCount: totalHandled,
  };
};

module.exports = {
  getAdminDashboard,
  getReceptionistDashboard,
  getEmployeeDashboard,
};
