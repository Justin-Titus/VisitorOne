const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('employeeRef', 'name employeeCode');
  res.status(200).json(new ApiResponse(200, users, 'Users fetched successfully'));
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, employeeRef } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    employeeRef: role === 'employee' ? employeeRef : undefined,
  });

  const userProfile = user.toObject();
  delete userProfile.password;

  res.status(201).json(new ApiResponse(201, userProfile, 'User created successfully'));
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('employeeRef');
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, role, employeeRef } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (name) user.name = name;
  if (role) {
    user.role = role;
    user.employeeRef = role === 'employee' ? employeeRef : undefined;
  }
  
  await user.save();
  res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});

const toggleStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (req.user._id.toString() === user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  if (user.role === 'admin') {
    throw new ApiError(400, 'Admin accounts cannot be deactivated to prevent system lockouts');
  }

  user.isActive = !user.isActive;
  await user.save();
  res.status(200).json(new ApiResponse(200, user, `User account ${user.isActive ? 'activated' : 'deactivated'}`));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.password = newPassword;
  await user.save();
  res.status(200).json(new ApiResponse(200, null, 'Password reset successfully'));
});

module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  toggleStatus,
  resetPassword,
};
