import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import User from '../models/User.model';
import env from '../config/env';
import { JwtPayload } from '../types';

const authMiddleware = asyncHandler(async (req, _res, next) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret) as JwtPayload;

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User associated with this token no longer exists');
    }
    if (!user.isActive) {
      throw new ApiError(403, 'User account is deactivated');
    }

    req.user = user as typeof req.user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired');
    }
    throw new ApiError(401, 'Not authorized, token failed');
  }
});

export default authMiddleware;
