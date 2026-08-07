const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');

const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAdminDashboard();
  res.status(200).json(new ApiResponse(200, data, 'Admin dashboard fetched'));
});

const getReceptionistDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getReceptionistDashboard();
  res.status(200).json(new ApiResponse(200, data, 'Receptionist dashboard fetched'));
});

const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getEmployeeDashboard(req.user.employeeRef);
  res.status(200).json(new ApiResponse(200, data, 'Employee dashboard fetched'));
});

module.exports = {
  getAdminDashboard,
  getReceptionistDashboard,
  getEmployeeDashboard,
};
