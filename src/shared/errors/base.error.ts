/**
 * Base error class for all application errors
 * Extends the native Error class with additional properties
 */

import { ErrorCode } from '../constants/error-codes.constant.js';

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly statusCode: number;
  readonly timestamp: Date;
  readonly isOperational: boolean;

  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging or API response
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
    };
  }

  /**
   * Convert error to API error format
   */
  toApiError(includeStack = false): {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  } {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      ...(includeStack && { stack: this.stack }),
    };
  }
}
