/**
 * Error Handler Middleware
 * Global error handling for Express application
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/base.error.js';
import { errorResponse } from '@/shared/types/api-response.type.js';
import { log as logger } from '@shared/utils/index.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error('Error caught by global handler:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Handle known AppError instances
  if (error instanceof AppError) {
    res.status(error.statusCode).json(
      errorResponse(
        {
          code: error.code,
          message: error.message,
          details: error.details,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        {
          timestamp: new Date().toISOString(),
        }
      )
    );
    return;
  }

  // Handle unknown errors
  res.status(500).json(
    errorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      {
        timestamp: new Date().toISOString(),
      }
    )
  );
};
