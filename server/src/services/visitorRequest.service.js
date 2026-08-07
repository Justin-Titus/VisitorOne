const VisitRequest = require('../models/VisitRequest.model');
const Visitor = require('../models/Visitor.model');
const Employee = require('../models/Employee.model');
const { logActivity } = require('./activityLog.service');
const ApiError = require('../utils/ApiError');
const { VISIT_STATUS, ACTIVITY_ACTIONS, EMPLOYEE_STATUS } = require('../utils/constants');

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


// Endpoints
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

  return visitRequest;
};

const getVisitRequests = async (filters, user, page = 1, limit = 10) => {
  const query = {};
  
  if (filters.status) query.status = filters.status;
  
  if (filters.visitDate) {
    query.visitDateString = filters.visitDate;
  } else if (filters.from || filters.to) {
    query.visitDate = {};
    if (filters.from) query.visitDate.$gte = new Date(filters.from);
    if (filters.to) query.visitDate.$lte = new Date(filters.to);
  }

  if (user.role === 'employee') {
    query.employeeToVisit = user.employeeRef;
  }
  
  if (filters.activeOnly) {
     query.status = { $nin: [VISIT_STATUS.CANCELLED, VISIT_STATUS.REJECTED] };
  }

  let visitorMatch = {};
  if (filters.visitorName) {
    visitorMatch.name = { $regex: filters.visitorName, $options: 'i' };
  }

  let employeeMatch = {};
  if (filters.employeeName) {
    employeeMatch.name = { $regex: filters.employeeName, $options: 'i' };
  }
  
  const skip = (page - 1) * limit;

  const data = await VisitRequest.find(query)
    .populate({
      path: 'visitor',
      match: Object.keys(visitorMatch).length > 0 ? visitorMatch : undefined
    })
    .populate({
      path: 'employeeToVisit',
      match: Object.keys(employeeMatch).length > 0 ? employeeMatch : undefined
    })
    .sort({ visitDate: -1, createdAt: -1 });
    
  const filteredData = data.filter(doc => doc.visitor != null && doc.employeeToVisit != null);

  const paginatedData = filteredData.slice(skip, skip + limit);
  const total = filteredData.length;

  return {
    data: paginatedData,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages: Math.ceil(total / limit),
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
  if (request.status !== VISIT_STATUS.PENDING) {
    throw new ApiError(400, 'Only pending requests can be approved');
  }
  
  request.status = VISIT_STATUS.APPROVED;
  request.approvedBy = user._id;
  request.decidedAt = new Date();
  if (remarks) request.remarks = remarks;
  
  await request.save();
  await logActivity(request._id, ACTIVITY_ACTIONS.APPROVED, user._id, remarks || 'Request approved');
  
  return request;
};

const rejectRequest = async (id, user, remarks) => {
  const request = await getVisitRequestById(id, user);
  if (request.status !== VISIT_STATUS.PENDING) {
    throw new ApiError(400, 'Only pending requests can be rejected');
  }
  if (!remarks) {
    throw new ApiError(400, 'Remarks are required for rejecting a request');
  }
  
  request.status = VISIT_STATUS.REJECTED;
  request.rejectedBy = user._id;
  request.decidedAt = new Date();
  request.remarks = remarks;
  
  await request.save();
  await logActivity(request._id, ACTIVITY_ACTIONS.REJECTED, user._id, remarks);
  
  return request;
};

const addRemarks = async (id, user, remarks) => {
  const request = await getVisitRequestById(id, user);
  request.remarks = remarks;
  await request.save();
  return request;
};

const checkInVisitor = async (id, user) => {
  const request = await VisitRequest.findById(id);
  if (!request) throw new ApiError(404, 'Visit request not found');

  checkNotAlreadyCheckedIn(request);
  checkNotRejectedForCheckIn(request);
  checkApprovedForCheckIn(request);

  request.status = VISIT_STATUS.CHECKED_IN;
  request.checkInTime = new Date();
  await request.save();

  await logActivity(request._id, ACTIVITY_ACTIONS.CHECKED_IN, user._id, 'Visitor checked in');
  return request;
};

const checkOutVisitor = async (id, user) => {
  const request = await VisitRequest.findById(id);
  if (!request) throw new ApiError(404, 'Visit request not found');
  
  if (request.status !== VISIT_STATUS.CHECKED_IN) {
    throw new ApiError(400, 'Visitor is not checked in');
  }

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
  
  if (request.status === VISIT_STATUS.CHECKED_IN || request.status === VISIT_STATUS.CHECKED_OUT) {
    throw new ApiError(400, 'Cannot cancel after check-in');
  }
  
  request.status = VISIT_STATUS.CANCELLED;
  request.cancelledBy = user._id;
  request.cancelledAt = new Date();
  if (remarks) request.remarks = remarks;
  await request.save();

  await logActivity(request._id, ACTIVITY_ACTIONS.CANCELLED, user._id, remarks || 'Request cancelled');
  return request;
};

module.exports = {
  createVisitRequest,
  getVisitRequests,
  getVisitRequestById,
  approveRequest,
  rejectRequest,
  addRemarks,
  checkInVisitor,
  checkOutVisitor,
  cancelRequest
};
