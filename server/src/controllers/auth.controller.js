const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  res.status(200).json(new ApiResponse(200, data, 'Login successful'));
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'User profile fetched successfully'));
});

module.exports = {
  login,
  getMe,
};
