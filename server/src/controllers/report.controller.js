const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/report.service');
const ApiResponse = require('../utils/ApiResponse');

const getVisitorAnalytics = asyncHandler(async (req, res) => {
  const data = await reportService.getVisitorAnalytics(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Visitor analytics report fetched successfully'));
});

const getSummary = asyncHandler(async (req, res) => {
  const { range, from, to } = req.query;
  const data = await reportService.getSummaryReport(range, from, to);
  res.status(200).json(new ApiResponse(200, data, 'Summary report fetched successfully'));
});

module.exports = {
  getVisitorAnalytics,
  getSummary,
};
