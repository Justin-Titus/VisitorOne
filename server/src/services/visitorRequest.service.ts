import VisitRequest from '../models/VisitRequest.model';
import Visitor from '../models/Visitor.model';
import Employee from '../models/Employee.model';
import { logActivity } from './activityLog.service';
import * as notificationService from './notification.service';
import { ApiError } from '../utils/ApiError';
import { VISIT_STATUS, ACTIVITY_ACTIONS, EMPLOYEE_STATUS } from '../utils/constants';
import { escapeRegex } from '../utils/helpers';
import { AuthUser, BulkOperationResult, CreateVisitRequestPayload, VisitStatus } from '../types';
import { Types } from 'mongoose';

// State Machine matrix for valid status transitions
const VALID_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  [VISIT_STATUS.PENDING]: [VISIT_STATUS.APPROVED, VISIT_STATUS.REJECTED, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.APPROVED]: [VISIT_STATUS.CHECKED_IN, VISIT_STATUS.CANCELLED],
  [VISIT_STATUS.CHECKED_IN]: [VISIT_STATUS.CHECKED_OUT],
  [VISIT_STATUS.CHECKED_OUT]: [],
  [VISIT_STATUS.REJECTED]: [],
  [VISIT_STATUS.CANCELLED]: [],
};

const validateStateTransition = (
  currentStatus: VisitStatus,
  targetStatus: VisitStatus,
): void => {
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
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
      throw new ApiError(400, 'Only pending requests can be approved');
    } else if (targetStatus === VISIT_STATUS.REJECTED) {
      throw new ApiError(400, 'Only pending requests can be rejected');
    }
    throw new ApiError(400, `Cannot perform this action on a '${currentStatus}' pass`);
  }
};

// Business rule helpers
const checkNoActiveVisit = async (visitorId: Types.ObjectId): Promise<void> => {
  const activeVisit = await VisitRequest.findOne({
    visitor: visitorId,
    status: { $in: [VISIT_STATUS.PENDING, VISIT_STATUS.APPROVED, VISIT_STATUS.CHECKED_IN] },
  });
  if (activeVisit) {
    throw new ApiError(409, 'Visitor already has an active visit request');
  }
};

const checkNoDuplicateOnDate = async (
  visitorId: Types.ObjectId,
  visitDateString: string,
): Promise<void> => {
  const duplicate = await VisitRequest.findOne({ visitor: visitorId, visitDateString });
  if (duplicate) {
    throw new ApiError(409, 'Visitor already has a registration for this date');
  }
};

const checkVisitDateNotPast = (visitDate: Date): void => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vDateCopy = new Date(visitDate.getTime());
  vDateCopy.setHours(0, 0, 0, 0);
  if (vDateCopy < today) {
    throw new ApiError(400, 'Visit date cannot be earlier than today');
  }
};

const checkArrivalTimeNotPast = (visitDate: Date, expectedArrivalTime: string): void => {
  const today = new Date();
  if (
    visitDate.getFullYear() === today.getFullYear() &&
    visitDate.getMonth() === today.getMonth() &&
    visitDate.getDate() === today.getDate()
  ) {
    const [expectedHour, expectedMinute] = expectedArrivalTime.split(':').map(Number);
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    if (
      (expectedHour as number) < currentHour ||
      ((expectedHour as number) === currentHour && (expectedMinute as number) < currentMinute)
    ) {
      throw new ApiError(
        400,
        'Expected arrival time cannot be earlier than current time for today',
      );
    }
  }
};

const checkEmployeePendingLimit = async (employeeId: string): Promise<void> => {
  const count = await VisitRequest.countDocuments({
    employeeToVisit: employeeId,
    status: VISIT_STATUS.PENDING,
  });
  if (count >= 3) {
    throw new ApiError(
      409,
      'Employee has reached the maximum limit of pending visitor requests (3)',
    );
  }
};

// Service methods
export const createVisitRequest = async (
  payload: CreateVisitRequestPayload,
  createdBy: Types.ObjectId,
) => {
  const { visitorData, visitDate, expectedArrivalTime, employeeToVisit, purpose } = payload;

  const employee = await Employee.findById(employeeToVisit);
  if (!employee) throw new ApiError(404, 'Employee to visit not found');
  if (employee.status !== EMPLOYEE_STATUS.ACTIVE) {
    throw new ApiError(400, 'Selected employee is not active');
  }

  // Create or find visitor (phone is the unique identifier)
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
  const visitDateString = vDate.toISOString().split('T')[0] as string;

  checkVisitDateNotPast(vDate);
  checkArrivalTimeNotPast(vDate, expectedArrivalTime);
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

  await logActivity(
    visitRequest._id,
    ACTIVITY_ACTIONS.CREATED,
    createdBy,
    'Visitor registered',
  );

  // Fire-and-forget notifications
  notificationService
    .notifyVisitorCreated(visitRequest, employee, visitor)
    .catch(() => {});

  return visitRequest;
};

export const getVisitRequests = async (
  filters: Record<string, unknown>,
  user: AuthUser,
  page = 1,
  limit = 10,
) => {
  const query: Record<string, unknown> = {};

  // Status filter
  if (filters['status']) {
    if (Array.isArray(filters['status'])) {
      query['status'] = { $in: filters['status'] };
    } else if ((filters['status'] as string).includes(',')) {
      query['status'] = { $in: (filters['status'] as string).split(',') };
    } else {
      query['status'] = filters['status'];
    }
  }

  // Date filtering
  if (filters['visitDate']) {
    query['visitDateString'] = filters['visitDate'];
  } else if (
    filters['startDate'] ||
    filters['endDate'] ||
    filters['from'] ||
    filters['to']
  ) {
    const sDate = (filters['startDate'] ?? filters['from']) as string | undefined;
    const eDate = (filters['endDate'] ?? filters['to']) as string | undefined;

    if (sDate && eDate) {
      query['visitDateString'] = { $gte: sDate, $lte: eDate };
    } else if (sDate) {
      query['visitDateString'] = { $gte: sDate };
    } else if (eDate) {
      query['visitDateString'] = { $lte: eDate };
    }
  }

  if (user.role === 'employee') {
    query['employeeToVisit'] = user.employeeRef;
  }

  if (filters['activeOnly']) {
    query['status'] = { $nin: [VISIT_STATUS.CANCELLED, VISIT_STATUS.REJECTED] };
  }

  // Visitor search
  if (filters['visitorName'] || filters['phone'] || filters['idProofNumber']) {
    const visitorQuery: Record<string, unknown> = {};
    if (filters['visitorName'])
      visitorQuery['name'] = {
        $regex: escapeRegex(filters['visitorName'] as string),
        $options: 'i',
      };
    if (filters['phone'])
      visitorQuery['phone'] = {
        $regex: escapeRegex(filters['phone'] as string),
        $options: 'i',
      };
    if (filters['idProofNumber'])
      visitorQuery['idProofNumber'] = {
        $regex: escapeRegex(filters['idProofNumber'] as string),
        $options: 'i',
      };
    const matchingVisitors = await Visitor.find(visitorQuery).select('_id');
    query['visitor'] = { $in: matchingVisitors.map((v) => v._id) };
  }

  // Employee search
  if (filters['employeeName'] || filters['department']) {
    const empQuery: Record<string, unknown> = {};
    if (filters['employeeName'])
      empQuery['name'] = {
        $regex: escapeRegex(filters['employeeName'] as string),
        $options: 'i',
      };
    if (filters['department'])
      empQuery['department'] = {
        $regex: escapeRegex(filters['department'] as string),
        $options: 'i',
      };
    const matchingEmployees = await Employee.find(empQuery).select('_id');
    query['employeeToVisit'] = { $in: matchingEmployees.map((e) => e._id) };
  }

  if (filters['purpose']) {
    query['purpose'] = {
      $regex: escapeRegex(filters['purpose'] as string),
      $options: 'i',
    };
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    VisitRequest.find(query)
      .populate('visitor')
      .populate('employeeToVisit')
      .sort({ visitDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    VisitRequest.countDocuments(query),
  ]);

  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getVisitRequestById = async (id: string, user: AuthUser) => {
  const request = await VisitRequest.findById(id)
    .populate('visitor')
    .populate('employeeToVisit')
    .populate('createdBy', 'name')
    .populate('approvedBy', 'name')
    .populate('rejectedBy', 'name')
    .populate('cancelledBy', 'name');

  if (!request) throw new ApiError(404, 'Visit request not found');

  const employeeToVisit = request.employeeToVisit as unknown as { _id: Types.ObjectId };
  if (
    user.role === 'employee' &&
    employeeToVisit._id.toString() !== user.employeeRef?.toString()
  ) {
    throw new ApiError(403, 'Not authorized to view this request');
  }

  return request;
};

export const approveRequest = async (
  id: string,
  user: AuthUser,
  remarks?: string,
) => {
  const request = await getVisitRequestById(id, user);
  validateStateTransition(request.status as VisitStatus, VISIT_STATUS.APPROVED);

  request.status = VISIT_STATUS.APPROVED;
  request.approvedBy = user._id;
  request.decidedAt = new Date();
  if (remarks) request.remarks = remarks;

  await request.save();
  await logActivity(
    request._id,
    ACTIVITY_ACTIONS.APPROVED,
    user._id,
    remarks ?? 'Request approved',
  );

  const emp = request.employeeToVisit as unknown as { name: string; email?: string; phone?: string };
  const vis = request.visitor as unknown as { name: string; email?: string; phone?: string; company?: string };
  notificationService.notifyVisitorApproved(request, emp, vis).catch(() => {});

  return request;
};

export const rejectRequest = async (
  id: string,
  user: AuthUser,
  remarks?: string,
) => {
  const request = await getVisitRequestById(id, user);
  validateStateTransition(request.status as VisitStatus, VISIT_STATUS.REJECTED);

  if (!remarks) throw new ApiError(400, 'Remarks are required for rejecting a request');

  request.status = VISIT_STATUS.REJECTED;
  request.rejectedBy = user._id;
  request.decidedAt = new Date();
  request.remarks = remarks;

  await request.save();
  await logActivity(request._id, ACTIVITY_ACTIONS.REJECTED, user._id, remarks);

  const emp = request.employeeToVisit as unknown as { name: string; email?: string; phone?: string };
  const vis = request.visitor as unknown as { name: string; email?: string; phone?: string; company?: string };
  notificationService.notifyVisitorRejected(request, emp, vis, remarks).catch(() => {});

  return request;
};

export const addRemarks = async (
  id: string,
  user: AuthUser,
  remarks?: string,
) => {
  const request = await getVisitRequestById(id, user);
  if (remarks) request.remarks = remarks;
  await request.save();
  return request;
};

export const checkInVisitor = async (id: string, user: AuthUser) => {
  const request = await VisitRequest.findById(id)
    .populate('visitor')
    .populate('employeeToVisit');
  if (!request) throw new ApiError(404, 'Visit request not found');

  validateStateTransition(request.status as VisitStatus, VISIT_STATUS.CHECKED_IN);

  request.status = VISIT_STATUS.CHECKED_IN;
  request.checkInTime = new Date();
  await request.save();

  await logActivity(
    request._id,
    ACTIVITY_ACTIONS.CHECKED_IN,
    user._id,
    'Visitor checked in',
  );

  const emp = request.employeeToVisit as unknown as { name: string; email?: string; phone?: string };
  const vis = request.visitor as unknown as { name: string; email?: string; phone?: string; company?: string };
  notificationService.notifyVisitorCheckedIn(request, emp, vis).catch(() => {});

  return request;
};

export const checkOutVisitor = async (id: string, user: AuthUser) => {
  const request = await VisitRequest.findById(id);
  if (!request) throw new ApiError(404, 'Visit request not found');

  validateStateTransition(request.status as VisitStatus, VISIT_STATUS.CHECKED_OUT);

  if (
    request.checkInTime &&
    new Date().getTime() < new Date(request.checkInTime).getTime()
  ) {
    throw new ApiError(400, 'Check-out time must be after check-in time');
  }

  request.status = VISIT_STATUS.CHECKED_OUT;
  request.checkOutTime = new Date();
  await request.save();

  await logActivity(
    request._id,
    ACTIVITY_ACTIONS.CHECKED_OUT,
    user._id,
    'Visitor checked out',
  );
  return request;
};

export const cancelRequest = async (
  id: string,
  user: AuthUser,
  remarks?: string,
) => {
  const request = await VisitRequest.findById(id);
  if (!request) throw new ApiError(404, 'Visit request not found');

  validateStateTransition(request.status as VisitStatus, VISIT_STATUS.CANCELLED);

  request.status = VISIT_STATUS.CANCELLED;
  request.cancelledBy = user._id;
  request.cancelledAt = new Date();
  if (remarks) request.remarks = remarks;
  await request.save();

  await logActivity(
    request._id,
    ACTIVITY_ACTIONS.CANCELLED,
    user._id,
    remarks ?? 'Request cancelled',
  );
  return request;
};

export const bulkApproveRequests = async (
  ids: string[],
  user: AuthUser,
  remarks = 'Bulk Approved',
): Promise<BulkOperationResult> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of request IDs to approve');
  }
  const results: BulkOperationResult = { succeeded: [], failed: [] };
  for (const id of ids) {
    try {
      const updated = await approveRequest(id, user, remarks);
      results.succeeded.push(updated._id);
    } catch (err) {
      results.failed.push({ id, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
};

export const bulkRejectRequests = async (
  ids: string[],
  user: AuthUser,
  remarks = 'Bulk Rejected',
): Promise<BulkOperationResult> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of request IDs to reject');
  }
  const results: BulkOperationResult = { succeeded: [], failed: [] };
  for (const id of ids) {
    try {
      const updated = await rejectRequest(id, user, remarks);
      results.succeeded.push(updated._id);
    } catch (err) {
      results.failed.push({ id, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
};

export const bulkCheckInVisitors = async (
  ids: string[],
  user: AuthUser,
): Promise<BulkOperationResult> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, 'Please provide an array of request IDs to check in');
  }
  const results: BulkOperationResult = { succeeded: [], failed: [] };
  for (const id of ids) {
    try {
      const updated = await checkInVisitor(id, user);
      results.succeeded.push(updated._id);
    } catch (err) {
      results.failed.push({ id, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
};
