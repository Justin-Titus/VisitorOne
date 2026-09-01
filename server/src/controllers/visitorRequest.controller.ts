import asyncHandler from '../utils/asyncHandler';
import * as visitorRequestService from '../services/visitorRequest.service';
import * as activityLogService from '../services/activityLog.service';
import { ApiResponse } from '../utils/ApiResponse';
import { CreateVisitRequestPayload } from '../types';

export const create = asyncHandler(async (req, res) => {
  const request = await visitorRequestService.createVisitRequest(
    req.body as CreateVisitRequestPayload,
    req.user._id,
  );
  res
    .status(201)
    .json(new ApiResponse(201, request, 'Visitor request created successfully'));
});

export const getAll = asyncHandler(async (req, res) => {
  const { page, limit, activeOnly, ...filters } = req.query as Record<string, string>;
  if (activeOnly === 'true') (filters as Record<string, unknown>)['activeOnly'] = true;

  const result = await visitorRequestService.getVisitRequests(
    filters,
    req.user,
    page ? parseInt(page, 10) : 1,
    limit ? parseInt(limit, 10) : 10,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Visitor requests fetched successfully'));
});

export const getById = asyncHandler(async (req, res) => {
  const request = await visitorRequestService.getVisitRequestById(
    req.params['id'] as string,
    req.user,
  );
  res
    .status(200)
    .json(new ApiResponse(200, request, 'Visitor request fetched successfully'));
});

export const approve = asyncHandler(async (req, res) => {
  const { remarks } = req.body as { remarks?: string };
  const request = await visitorRequestService.approveRequest(
    req.params['id'] as string,
    req.user,
    remarks,
  );
  res.status(200).json(new ApiResponse(200, request, 'Visitor request approved'));
});

export const reject = asyncHandler(async (req, res) => {
  const { remarks } = req.body as { remarks?: string };
  const request = await visitorRequestService.rejectRequest(
    req.params['id'] as string,
    req.user,
    remarks,
  );
  res.status(200).json(new ApiResponse(200, request, 'Visitor request rejected'));
});

export const addRemarks = asyncHandler(async (req, res) => {
  const { remarks } = req.body as { remarks?: string };
  const request = await visitorRequestService.addRemarks(
    req.params['id'] as string,
    req.user,
    remarks,
  );
  res.status(200).json(new ApiResponse(200, request, 'Remarks updated'));
});

export const checkIn = asyncHandler(async (req, res) => {
  const request = await visitorRequestService.checkInVisitor(
    req.params['id'] as string,
    req.user,
  );
  res
    .status(200)
    .json(new ApiResponse(200, request, 'Visitor checked in successfully'));
});

export const checkOut = asyncHandler(async (req, res) => {
  const request = await visitorRequestService.checkOutVisitor(
    req.params['id'] as string,
    req.user,
  );
  res
    .status(200)
    .json(new ApiResponse(200, request, 'Visitor checked out successfully'));
});

export const cancel = asyncHandler(async (req, res) => {
  const { remarks } = req.body as { remarks?: string };
  const request = await visitorRequestService.cancelRequest(
    req.params['id'] as string,
    req.user,
    remarks,
  );
  res.status(200).json(new ApiResponse(200, request, 'Visitor request cancelled'));
});

export const getActivity = asyncHandler(async (req, res) => {
  await visitorRequestService.getVisitRequestById(req.params['id'] as string, req.user);
  const logs = await activityLogService.getActivitiesForRequest(
    req.params['id'] as string,
  );
  res
    .status(200)
    .json(new ApiResponse(200, logs, 'Activity logs fetched successfully'));
});

export const getGlobalActivityLogs = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query as Record<string, string>;
  const result = await activityLogService.getGlobalActivityLogs(
    filters,
    page ? parseInt(page, 10) : 1,
    limit ? parseInt(limit, 10) : 10,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Global activity logs fetched successfully'));
});

export const bulkApprove = asyncHandler(async (req, res) => {
  const { ids, remarks } = req.body as { ids: string[]; remarks?: string };
  const result = await visitorRequestService.bulkApproveRequests(ids, req.user, remarks);

  let message = 'Bulk approval completed';
  if (result.succeeded.length === 0 && result.failed.length > 0) {
    message = `Bulk approval failed: ${result.failed[0]?.reason}`;
  } else if (result.succeeded.length > 0 && result.failed.length > 0) {
    message = `Approved ${result.succeeded.length} pass(es) (${result.failed.length} skipped)`;
  } else if (result.succeeded.length > 0) {
    message = `Successfully approved ${result.succeeded.length} pass(es)`;
  }

  const statusCode = result.succeeded.length > 0 ? 200 : 400;
  res.status(statusCode).json(new ApiResponse(statusCode, result, message));
});

export const bulkReject = asyncHandler(async (req, res) => {
  const { ids, remarks } = req.body as { ids: string[]; remarks?: string };
  const result = await visitorRequestService.bulkRejectRequests(ids, req.user, remarks);

  let message = 'Bulk rejection completed';
  if (result.succeeded.length === 0 && result.failed.length > 0) {
    message = `Bulk rejection failed: ${result.failed[0]?.reason}`;
  } else if (result.succeeded.length > 0 && result.failed.length > 0) {
    message = `Rejected ${result.succeeded.length} pass(es) (${result.failed.length} skipped)`;
  } else if (result.succeeded.length > 0) {
    message = `Successfully rejected ${result.succeeded.length} pass(es)`;
  }

  const statusCode = result.succeeded.length > 0 ? 200 : 400;
  res.status(statusCode).json(new ApiResponse(statusCode, result, message));
});

export const bulkCheckIn = asyncHandler(async (req, res) => {
  const { ids } = req.body as { ids: string[] };
  const result = await visitorRequestService.bulkCheckInVisitors(ids, req.user);

  let message = 'Bulk check-in completed';
  if (result.succeeded.length === 0 && result.failed.length > 0) {
    message = `Bulk check-in failed: ${result.failed[0]?.reason}`;
  } else if (result.succeeded.length > 0 && result.failed.length > 0) {
    message = `Checked in ${result.succeeded.length} visitor(s) (${result.failed.length} skipped)`;
  } else if (result.succeeded.length > 0) {
    message = `Successfully checked in ${result.succeeded.length} visitor(s)`;
  }

  const statusCode = result.succeeded.length > 0 ? 200 : 400;
  res.status(statusCode).json(new ApiResponse(statusCode, result, message));
});
