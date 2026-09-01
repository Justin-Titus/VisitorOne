import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else {
    let statusCode = 500;
    let message = err.message || 'Something went wrong';
    let details: string[] = [];

    const anyErr = err as any;

    // Mongoose duplicate key
    if (anyErr.code === 11000) {
      statusCode = 409; // Conflict
      const field = Object.keys(anyErr.keyValue || {})[0] || 'Field';
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    } 
    // Mongoose validation error
    else if (err instanceof mongoose.Error.ValidationError) {
      statusCode = 400;
      const messages = Object.values(err.errors).map((val) => val.message);
      message = 'Invalid input data.';
      details = messages;
    } 
    // Mongoose cast error (invalid ObjectId, etc.)
    else if (err instanceof mongoose.Error.CastError) {
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}.`;
    } 
    // General Mongoose error fallback
    else if (err instanceof mongoose.Error) {
      statusCode = 400;
    }

    error = new ApiError(statusCode, message, details);
  }

  const response: Record<string, unknown> = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
  };

  if (error.details && Array.isArray(error.details) && error.details.length > 0) {
    response['errors'] = error.details;
  }

  if (process.env['NODE_ENV'] === 'development') {
    response['stack'] = err.stack;
  }

  res.status(error.statusCode).json(response);
};

export default errorHandler;
