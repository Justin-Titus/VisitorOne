import User from '../models/User.model';
import asyncHandler from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().populate('employeeRef', 'name employeeCode');
  res.status(200).json(new ApiResponse(200, users, 'Users fetched successfully'));
});

const protectedEmails = [
  'admin@visitorone.com',
  'reception@visitorone.com',
  'alice.smith@visitorone.com',
  'bob.jones@visitorone.com',
  'charlie.brown@visitorone.com'
];

const checkProtectedAccount = (email: string) => {
  if (protectedEmails.includes(email)) {
    throw new ApiError(403, 'Demo accounts cannot be modified in this showcase environment.');
  }
};

export const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    employeeRef,
  } = req.body as {
    name: string;
    email: string;
    password: string;
    role: string;
    employeeRef?: string;
  };

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

  const userProfile = user.toObject() as unknown as Record<string, unknown>;
  delete userProfile['password'];

  res.status(201).json(new ApiResponse(201, userProfile, 'User created successfully'));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params['id']).populate('employeeRef');
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});

export const updateUser = asyncHandler(async (req, res) => {
  const { name, role, employeeRef } = req.body as {
    name?: string;
    role?: string;
    employeeRef?: string;
  };
  const user = await User.findById(req.params['id']);
  if (!user) throw new ApiError(404, 'User not found');

  checkProtectedAccount(user.email);

  if (name) user.name = name;
  if (role) {
    user.role = role as typeof user.role;
    user.employeeRef =
      role === 'employee' && employeeRef
        ? (employeeRef as unknown as typeof user.employeeRef)
        : undefined;
  }

  await user.save();
  res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params['id']);
  if (!user) throw new ApiError(404, 'User not found');

  if (req.user._id.toString() === user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  if (user.role === 'admin') {
    throw new ApiError(400, 'Admin accounts cannot be deactivated to prevent system lockouts');
  }

  user.isActive = !user.isActive;
  await user.save();
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        `User account ${user.isActive ? 'activated' : 'deactivated'}`,
      ),
    );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body as { newPassword: string };
  const user = await User.findById(req.params['id']);
  if (!user) throw new ApiError(404, 'User not found');

  checkProtectedAccount(user.email);

  user.password = newPassword;
  await user.save();
  res.status(200).json(new ApiResponse(200, null, 'Password reset successfully'));
});
