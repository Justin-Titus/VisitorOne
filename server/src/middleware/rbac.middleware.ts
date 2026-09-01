import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { Role } from '../types';

const authorize = (...roles: Role[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      next(
        new ApiError(
          403,
          `User role '${req.user?.role}' is not authorized to access this route`,
        ),
      );
    } else {
      next();
    }
  };
};

export default authorize;
