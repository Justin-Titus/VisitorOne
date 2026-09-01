import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

export default notFoundHandler;
