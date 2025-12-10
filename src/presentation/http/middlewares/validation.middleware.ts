/**
 * Validation Middleware
 * Validates request data using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '@/shared/errors/base.error.js';

export interface ValidationTarget {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validate request data against Zod schemas
 */
export const validate = (schemas: ValidationTarget) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate params
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = new AppError(
          'VALIDATION_ERROR',
          'Validation failed',
          400,
          error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          }))
        );
        next(validationError);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate only request body
 */
export const validateBody = (schema: ZodSchema) => {
  return validate({ body: schema });
};

/**
 * Validate only query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return validate({ query: schema });
};

/**
 * Validate only route parameters
 */
export const validateParams = (schema: ZodSchema) => {
  return validate({ params: schema });
};
