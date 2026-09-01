import asyncHandler from '../utils/asyncHandler';
import * as dashboardService from '../services/dashboard.service';
import { ApiResponse } from '../utils/ApiResponse';

export const getAdminDashboard = asyncHandler(async (_req, res) => {
  const data = await dashboardService.getAdminDashboard();
  res.status(200).json(new ApiResponse(200, data, 'Admin dashboard fetched'));
});

export const getReceptionistDashboard = asyncHandler(async (_req, res) => {
  const data = await dashboardService.getReceptionistDashboard();
  res.status(200).json(new ApiResponse(200, data, 'Receptionist dashboard fetched'));
});

export const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getEmployeeDashboard(req.user.employeeRef);
  res.status(200).json(new ApiResponse(200, data, 'Employee dashboard fetched'));
});
