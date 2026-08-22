const asyncHandler = require('../utils/asyncHandler');
const visitorRequestService = require('../services/visitorRequest.service');
const activityLogService = require('../services/activityLog.service');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const request = await visitorRequestService.createVisitRequest(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, request, 'Visitor request created successfully'));
});

const getAll = asyncHandler(async (req, res) => {
  const { page, limit, activeOnly, ...filters } = req.query;
  if (activeOnly === 'true') filters.activeOnly = true;

  const result = await visitorRequestService.getVisitRequests(filters, req.user, page, limit);
  res.status(200).json(new ApiResponse(200, result, 'Visitor requests fetched successfully'));
});

const getById = asyncHandler(async (req, res) => {
  const request = await visitorRequestService.getVisitRequestById(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, request, 'Visitor request fetched successfully'));
});

const approve = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const request = await visitorRequestService.approveRequest(req.params.id, req.user, remarks);
  res.status(200).json(new ApiResponse(200, request, 'Visitor request approved'));
});

const reject = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const request = await visitorRequestService.rejectRequest(req.params.id, req.user, remarks);
  res.status(200).json(new ApiResponse(200, request, 'Visitor request rejected'));
});

const addRemarks = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const request = await visitorRequestService.addRemarks(req.params.id, req.user, remarks);
  res.status(200).json(new ApiResponse(200, request, 'Remarks updated'));
});

const checkIn = asyncHandler(async (req, res) => {
  const request = await visitorRequestService.checkInVisitor(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, request, 'Visitor checked in successfully'));
});

const checkOut = asyncHandler(async (req, res) => {
  const request = await visitorRequestService.checkOutVisitor(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, request, 'Visitor checked out successfully'));
});

const cancel = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  const request = await visitorRequestService.cancelRequest(req.params.id, req.user, remarks);
  res.status(200).json(new ApiResponse(200, request, 'Visitor request cancelled'));
});

const getActivity = asyncHandler(async (req, res) => {
  await visitorRequestService.getVisitRequestById(req.params.id, req.user);
  const logs = await activityLogService.getActivitiesForRequest(req.params.id);
  res.status(200).json(new ApiResponse(200, logs, 'Activity logs fetched successfully'));
});

const getGlobalActivityLogs = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const result = await activityLogService.getGlobalActivityLogs(filters, page, limit);
  res.status(200).json(new ApiResponse(200, result, 'Global activity logs fetched successfully'));
});

const bulkApprove = asyncHandler(async (req, res) => {
  const { ids, remarks } = req.body;
  const result = await visitorRequestService.bulkApproveRequests(ids, req.user, remarks);

  let message = 'Bulk approval completed';
  if (result.succeeded.length === 0 && result.failed.length > 0) {
    message = `Bulk approval failed: ${result.failed[0].reason}`;
  } else if (result.succeeded.length > 0 && result.failed.length > 0) {
    message = `Approved ${result.succeeded.length} pass(es) (${result.failed.length} skipped)`;
  } else if (result.succeeded.length > 0) {
    message = `Successfully approved ${result.succeeded.length} pass(es)`;
  }

  const statusCode = result.succeeded.length > 0 ? 200 : 400;
  res.status(statusCode).json(new ApiResponse(statusCode, result, message));
});

const bulkReject = asyncHandler(async (req, res) => {
  const { ids, remarks } = req.body;
  const result = await visitorRequestService.bulkRejectRequests(ids, req.user, remarks);

  let message = 'Bulk rejection completed';
  if (result.succeeded.length === 0 && result.failed.length > 0) {
    message = `Bulk rejection failed: ${result.failed[0].reason}`;
  } else if (result.succeeded.length > 0 && result.failed.length > 0) {
    message = `Rejected ${result.succeeded.length} pass(es) (${result.failed.length} skipped)`;
  } else if (result.succeeded.length > 0) {
    message = `Successfully rejected ${result.succeeded.length} pass(es)`;
  }

  const statusCode = result.succeeded.length > 0 ? 200 : 400;
  res.status(statusCode).json(new ApiResponse(statusCode, result, message));
});

const bulkCheckIn = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const result = await visitorRequestService.bulkCheckInVisitors(ids, req.user);

  let message = 'Bulk check-in completed';
  if (result.succeeded.length === 0 && result.failed.length > 0) {
    message = `Bulk check-in failed: ${result.failed[0].reason}`;
  } else if (result.succeeded.length > 0 && result.failed.length > 0) {
    message = `Checked in ${result.succeeded.length} visitor(s) (${result.failed.length} skipped)`;
  } else if (result.succeeded.length > 0) {
    message = `Successfully checked in ${result.succeeded.length} visitor(s)`;
  }

  const statusCode = result.succeeded.length > 0 ? 200 : 400;
  res.status(statusCode).json(new ApiResponse(statusCode, result, message));
});

module.exports = {
  create,
  getAll,
  getById,
  approve,
  reject,
  addRemarks,
  checkIn,
  checkOut,
  cancel,
  getActivity,
  getGlobalActivityLogs,
  bulkApprove,
  bulkReject,
  bulkCheckIn,
};
