/**
 * Validation errors
 * Input validation and data format errors
 */

import { AppError } from './base.error.js';
import { ErrorCode } from '../constants/error-codes.constant.js';

/**
 * Base validation error
 */
export class ValidationError extends AppError {
  readonly code = ErrorCode.VALIDATION_ERROR;
  readonly statusCode = 400;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

/**
 * Invalid input error
 */
export class InvalidInputError extends AppError {
  readonly code = ErrorCode.INVALID_INPUT;
  readonly statusCode = 400;

  constructor(field: string, message?: string) {
    super(message ?? `Invalid input for field '${field}'`, { field });
  }
}

/**
 * Invalid format error
 */
export class InvalidFormatError extends AppError {
  readonly code = ErrorCode.INVALID_FORMAT;
  readonly statusCode = 400;

  constructor(field: string, expectedFormat: string, receivedValue?: unknown) {
    super(
      `Invalid format for field '${field}'. Expected: ${expectedFormat}`,
      { field, expectedFormat, receivedValue }
    );
  }
}

/**
 * Missing required field error
 */
export class MissingRequiredFieldError extends AppError {
  readonly code = ErrorCode.MISSING_REQUIRED_FIELD;
  readonly statusCode = 400;

  constructor(field: string) {
    super(`Missing required field: '${field}'`, { field });
  }
}

/**
 * Zod validation error wrapper
 * Transforms Zod errors into our error format
 */
export class ZodValidationError extends ValidationError {
  constructor(issues: Array<{ path: string[]; message: string }>) {
    const formattedIssues = issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    super('Validation failed', formattedIssues);
  }
}
