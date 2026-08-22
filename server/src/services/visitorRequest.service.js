const VisitRequest = require('../models/VisitRequest.model');
const Visitor = require('../models/Visitor.model');
const Employee = require('../models/Employee.model');
const { logActivity } = require('./activityLog.service');
const notificationService = require('./notification.service');
const ApiError = require('../utils/ApiError');
const { VISIT_STATUS, ACTIVITY_ACTIONS, EMPLOYEE_STATUS } = require('../utils/constants');
const { escapeRegex } = require('../utils/helpers');

// State Machine matrix for valid status transitions
const VALID_TRANSITIONS = {
  [VISIT_STATUS.PENDING]: [VISIT_STATUS.APPROVED, VISIT_STATUS.REJECTED, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.APPROVED]: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.CHECKED_IN]: [VISIT_STATUS.CHECKED_OUT],
  [VISIT_STATUS.CHECKED_OUT]: [],
  [VISIT_STATUS.REJECTED]: [],
  [VISIT_STATUS.CANCELLED]: [],
};

const validateStateTransition = (currentStatus, targetStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    if (targetStatus === VISIT_STATUS.CHECKED_IN) {
      if (currentStatus === VISIT_STATUS.PENDING) {
        throw new ApiError(400, 'Pass must be approved before check-in');
      } else if (currentStatus === VISIT_STATUS.REJECTED) {
        throw new ApiError(400, 'Cannot check in a rejected pass');
      } else if (currentStatus === VISIT_STATUS.CANCELLED) {
        throw new ApiError(400, 'Cannot check in a cancelled pass');
      } else if (currentStatus === VISIT_STATUS.CHECKED_OUT) {
        throw new ApiError(400, 'Pass is already checked out');
      }
    } else if (targetStatus === VISIT_STATUS.APPROVED) {
      throw new ApiError(400, `Only pending requests can be approved`);
    } else if (targetStatus === VISIT_STATUS.REJECTED) {
      throw new ApiError(400, `Only pending requests can be rejected`);
    }
    throw new ApiError(400, `Cannot perform this action on a '${currentStatus}' pass`);
  }
};

// Rules
const checkNoActiveVisit = async (visitorId) => {
  const activeVisit = await VisitRequest.findOne({
    visitor: visitorId,
    status: { $in: [VISIT_STATUS.PENDING, VISIT_STATUS.APPROVED, VISIT_STATUS.CHECKED_IN] },
  });
  if (activeVisit) {
    throw new ApiError(409, 'Visitor already has an active visit request');
  }
};

const checkNoDuplicateOnDate = async (visitorId, visitDateString) => {
  const duplicate = await VisitRequest.findOne({
    visitor: visitorId,
    visitDateString,
  });
  if (duplicate) {
    throw new ApiError(409, 'Visitor already has a registration for this date');
  }
};

const checkVisitDateNotPast = (visitDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vDate = new Date(visitDate);
  const vDateCopy = new Date(vDate.getTime());
  vDateCopy.setHours(0, 0, 0, 0);
  if (vDateCopy < today) {
    throw new ApiError(400, 'Visit date cannot be earlier than today');
  }
};

const checkArrivalTimeNotPast = (visitDate, expectedArrivalTime) => {
  const today = new Date();
  const vDate = new Date(visitDate);
  if (
    vDate.getFullYear() === today.getFullYear() &&
    vDate.getMonth() === today.getMonth() &&
    vDate.getDate() === today.getDate()
  ) {
    const [expectedHour, expectedMinute] = expectedArrivalTime.split(':').map(Number);
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    if (expectedHour < currentHour || (expectedHour === currentHour && expectedMinute < currentMinute)) {
      throw new ApiError(400, 'Expected arrival time cannot be earlier than current time for today');
    }
  }
};

const checkEmployeePendingLimit = async (employeeId) => {
  const count = await VisitRequest.countDocuments({
    employeeToVisit: employeeId,
    status: VISIT_STATUS.PENDING,
  });
  if (count >= 3) {
    throw new ApiError(409, 'Employee has reached the maximum limit of pending visitor requests (3)');
  }
};

const checkApprovedForCheckIn = (visitRequest) => {
  if (visitRequest.status !== VISIT_STATUS.APPROVED) {
    throw new ApiError(400, 'Visitor must be approved before check-in');
  }
};

const checkNotAlreadyCheckedIn = (visitRequest) => {
  if (visitRequest.status === VISIT_STATUS.CHECKED_IN) {
    throw new ApiError(400, 'Visitor is already checked in');
  }
};

const checkNotRejectedForCheckIn = (visitRequest) => {
  if (visitRequest.status === VISIT_STATUS.REJECTED) {
    throw new ApiError(400, 'Rejected requests cannot be checked in');
  }
};

const checkCheckOutAfterCheckIn = (checkInTime) => {
  if (new Date().getTime() < new Date(checkInTime).getTime()) {
    throw new ApiError(400, 'Check-out time must be after check-in time');
  }
};

// Endpoints / Service Methods
const createVisitRequest = async (payload, createdBy) => {
  let { visitorData, visitDate, expectedArrivalTime, employeeToVisit, purpose } = payload;

  const employee = await Employee.findById(employeeToVisit);
  if (!employee) {
    throw new ApiError(404, 'Employee to visit not found');
  }
  if (employee.status !== EMPLOYEE_STATUS.ACTIVE) {
    throw new ApiError(400, 'Selected employee is not active');
  }

  // Create or Find Visitor (phone is the unique identifier)
  const phone = visitorData.phone.replace(/\D/g, '');
  let visitor = await Visitor.findOne({ phone });

  if (!visitor) {
    visitor = new Visitor(visitorData);
    await visitor.save();
  } else {
    Object.assign(visitor, visitorData);
    await visitor.save();
  }

  const vDate = new Date(visitDate);
  const visitDateString = vDate.toISOString().split('T')[0];

  await checkVisitDateNotPast(vDate);
  await checkArrivalTimeNotPast(vDate, expectedArrivalTime);
  await checkNoActiveVisit(visitor._id);
  await checkNoDuplicateOnDate(visitor._id, visitDateString);
  await checkEmployeePendingLimit(employeeToVisit);

  const visitRequest = new VisitRequest({
    visitor: visitor._id,
    employeeToVisit,
    purpose,
    visitDate: vDate,
    visitDateString,
    expectedArrivalTime,
    createdBy,
  });
  await visitRequest.save();

  await logActivity(visitRequest._id, ACTIVITY_ACTIONS.CREATED, createdBy, 'Visitor registered');

  // Trigger Notification
  notificationService.notifyVisitorCreated(visitRequest, employee, visitor).catch(() => {});

  return visitRequest;
};

const getVisitRequests = async (filters = {}, user = {}, page = 1, limit = 10) => {
  const query = {};

  // Status Filter (Support array or comma-separated string)
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query.status = { $in: filters.status };
    } else if (filters.status.includes(',')) {
      query.status = { $in: filters.status.split(',') };
    } else {
      query.status = filters.status;
    }
  }

  // Multi-Condition Date Filtering
  if (filters.visitDate) {
    query.visitDateString = filters.visitDate;
  } else if (filters.startDate || filters.endDate || filters.from || filters.to) {
    const sDate = filters.startDate || filters.from;
    const eDate = filters.endDate || filters.to;

    if (sDate && eDate) {
      query.visitDateString = { $gte: sDate, $lte: eDate };
    } else if (sDate) {
      query.visitDateString = { $gte: sDate };
    } else if (eDate) {
      query.visitDateString = { $lte: eDate };
    }
  }

  if (user.role === 'employee') {
    query.employeeToVisit = user.employeeRef;
  }

  if (filters.activeOnly) {
    query.status = { $nin: [VISIT_STATUS.CANCELLED, VISIT_STATUS.REJECTED] };
  }

  // Search Filter: Visitor Name / Phone / ID Proof
  if (filters.visitorName || filters.phone || filters.idProofNumber) {
    const visitorQuery = {};
    if (filters.visitorName) visitorQuery.name = { $regex: escapeRegex(filters.visitorName), $options: 'i' };
    if (filters.phone) visitorQuery.phone = { $regex: escapeRegex(filters.phone), $options: 'i' };
    if (filters.idProofNumber) visitorQuery.idProofNumber = { $regex: escapeRegex(filters.idProofNumber), $options: 'i' };

    const matchingVisitors = await Visitor.find(visitorQuery).select('_id');
    query.visitor = { $in: matchingVisitors.map((v) => v._id) };
  }

  // Search Filter: Employee Name or Department
  if (filters.employeeName || filters.department) {
    const empQuery = {};
    if (filters.employeeName) empQuery.name = { $regex: escapeRegex(filters.employeeName), $options: 'i' };
    if (filters.department) empQuery.department = { $regex: escapeRegex(filters.department), $options: 'i' };

    const matchingEmployees = await Employee.find(empQuery).select('_id');
    query.employeeToVisit = { $in: matchingEmployees.map((e) => e._id) };
  }

  // Purpose Search Filter
  if (filters.purpose) {
    query.purpose = { $regex: escapeRegex(filters.purpose), $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    VisitRequest.find(query)
      .populate('visitor')
      .populate('employeeToVisit')
      .sort({ visitDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    VisitRequest.countDocuments(query),
  ]);

  return {
    data,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const getVisitRequestById = async (id, user) => {
  const request = await VisitRequest.findById(id)
    .populate('visitor')
    .populate('employeeToVisit')
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .populate('rejectedBy', 'name')
    .populate('cancelledBy', 'name');

  if (!request) {
    throw new ApiError(404, 'Visit request not found');
  }

  if (user.role === 'employee' && request.employeeToVisit._id.toString() !== user.employeeRef.toString()) {
    throw new ApiError(403, 'Not authorized to view this request');
  }

  return request;
};

const approveRequest = async (id, user, remarks) => {
  const request = await getVisitRequestById(id, user);
  validateStateTransition(request.status, VISIT_STATUS.APPROVED);

  request.status = VISIT_STATUS.APPROVED;
  request.approvedBy = user._id;
  request.decidedAt = new Date();
  if (remarks) request.remarks = remarks;

  await request.save();
  await logActivity(request._id, ACTIVITY_ACTIONS.APPROVED, user._id, remarks || 'Request approved');

  notificationService.notifyVisitorApproved(request, request.employeeToVisit, request.visitor).catch(() => {});

  return request;
};

const rejectRequest = async (id, user, remarks) => {
  const request = await getVisitRequestById(id, user);
  validateStateTransition(request.status, VISIT_STATUS.REJECTED);

  if (!remarks) {
    throw new ApiError(400, 'Remarks are required for rejecting a request');
  }

  request.status = VISIT_STATUS.REJECTED;
  request.rejectedBy = user._id;
  request.decidedAt = new Date();
  request.remarks = remarks;

  await request.save();
  await logActivity(request._id, ACTIVITY_ACTIONS.REJECTED, user._id, remarks);

  notificationService.notifyVisitorRejected(request, request.employeeToVisit, request.visitor, remarks).catch(() => {});

  return request;
};

const checkInVisitor = async (id, user) => {
  const request = await VisitRequest.findById(id).populate('visitor').populate('employeeToVisit');
  if (!request) throw new ApiError(404, 'Visit request not found');

  validateStateTransition(request.status, VISIT_STATUS.CHECKED_IN);
  checkNotAlreadyCheckedIn(request);
  checkNotRejectedForCheckIn(request);
  checkApprovedForCheckIn(request);

  request.status = VISIT_STATUS.CHECKED_IN;
  request.checkInTime = new Date();
  await request.save();

  await logActivity(request._id, ACTIVITY_ACTIONS.CHECKED_IN, user._id, 'Visitor checked in');

  notificationService.notifyVisitorCheckedIn(request, request.employeeToVisit, request.visitor).catch(() => {});

  return request;
};

const checkOutVisitor = async (id, user) => {
  const request = await VisitRequest.findById(id);
  if (!request) throw new ApiError(404, 'Visit request not found');

  validateStateTransition(request.status, VISIT_STATUS.CHECKED_OUT);
  checkCheckOutAfterCheckIn(request.checkInTime);

  request.status = VISIT_STATUS.CHECKED_OUT;
  request.checkOutTime = new Date();
  await request.save();

  await logActivity(request._id, ACTIVITY_ACTIONS.CHECKED_OUT, user._id, 'Visitor checked out');
  return request;
};

const cancelRequest = async (id, user, remarks) => {
  const request = await VisitRequest.findById(id);
  if (!request) throw new ApiError(404, 'Visit request not found');

  validateStateTransition(request.status, VISIT_STATUS.CANCELLED);

  request.status = VISIT_STATUS.CANCELLED;
  request.cancelledBy = user._id;
  request.cancelledAt = new Date();
  if (remarks) request.remarks = remarks;
  await request.save();

  await logActivity(request._id, ACTIVITY_ACTIONS.CANCELLED, user._id, remarks || 'Request cancelled');
  return request;
};

// Bulk Operations Implementation
const bulkApproveRequests = async (ids = [], user, remarks = 'Bulk Approved') => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of request IDs to approve');
  }

  const results = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const updated = await approveRequest(id, user, remarks);
      results.succeeded.push(updated._id);
    } catch (err) {
      results.failed.push({ id, reason: err.message });
    }
  }

  return results;
};

const bulkRejectRequests = async (ids = [], user, remarks = 'Bulk Rejected') => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of request IDs to reject');
  }

  const results = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const updated = await rejectRequest(id, user, remarks);
      results.succeeded.push(updated._id);
    } catch (err) {
      results.failed.push({ id, reason: err.message });
    }
  }

  return results;
};

const bulkCheckInVisitors = async (ids = [], user) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of request IDs to check in');
  }

  const results = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const updated = await checkInVisitor(id, user);
      results.succeeded.push(updated._id);
    } catch (err) {
      results.failed.push({ id, reason: err.message });
    }
  }

  return results;
};

module.exports = {
  createVisitRequest,
  getVisitRequests,
  getVisitRequestById,
  approveRequest,
  rejectRequest,
  checkInVisitor,
  checkOutVisitor,
  cancelRequest,
  bulkApproveRequests,
  bulkRejectRequests,
  bulkCheckInVisitors,
};
