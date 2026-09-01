import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import env from '../config/env';
import { Types } from 'mongoose';

const generateToken = (id: Types.ObjectId): string => {
  return jwt.sign({ id }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const login = async (
  email: string,
  password: string,
): Promise<{ user: Record<string, unknown>; token: string }> => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'User account is deactivated');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user._id);
  const userProfile = user.toObject() as unknown as Record<string, unknown>;
  delete userProfile['password'];

  return { user: userProfile, token };
};

export const getProfile = async (userId: Types.ObjectId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};
