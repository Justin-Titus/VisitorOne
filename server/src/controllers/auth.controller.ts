import asyncHandler from '../utils/asyncHandler';
import * as authService from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const data = await authService.login(email, password);
  res.status(200).json(new ApiResponse(200, data, 'Login successful'));
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'User profile fetched successfully'));
});
