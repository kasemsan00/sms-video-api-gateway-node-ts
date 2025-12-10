/**
 * HTTP-specific errors
 * Standard HTTP error responses
 */

import { AppError } from './base.error.js';
import { ErrorCode } from '../constants/error-codes.constant.js';

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  readonly code = ErrorCode.UNAUTHORIZED;
  readonly statusCode = 401;

  constructor(message = 'Unauthorized access', details?: unknown) {
    super(message, details);
  }
}

/**
 * Invalid token error
 */
export class InvalidTokenError extends AppError {
  readonly code = ErrorCode.INVALID_TOKEN;
  readonly statusCode = 401;

  constructor(message = 'Invalid authentication token') {
    super(message);
  }
}

/**
 * Token expired error
 */
export class TokenExpiredError extends AppError {
  readonly code = ErrorCode.TOKEN_EXPIRED;
  readonly statusCode = 401;

  constructor(expiredAt?: Date) {
    super('Authentication token has expired', {
      expiredAt: expiredAt?.toISOString(),
    });
  }
}

/**
 * Invalid credentials error
 */
export class InvalidCredentialsError extends AppError {
  readonly code = ErrorCode.INVALID_CREDENTIALS;
  readonly statusCode = 401;

  constructor(message = 'Invalid credentials') {
    super(message);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  readonly code = ErrorCode.FORBIDDEN;
  readonly statusCode = 403;

  constructor(message = 'Access forbidden', details?: unknown) {
    super(message, details);
  }
}

/**
 * Insufficient permissions error
 */
export class InsufficientPermissionsError extends AppError {
  readonly code = ErrorCode.INSUFFICIENT_PERMISSIONS;
  readonly statusCode = 403;

  constructor(requiredPermission?: string) {
    super('Insufficient permissions to perform this action', {
      requiredPermission,
    });
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly statusCode = 404;

  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} '${identifier}' not found`
        : `${resource} not found`,
      { resource, identifier }
    );
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
  readonly code = ErrorCode.CONFLICT;
  readonly statusCode = 409;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  readonly code = ErrorCode.INTERNAL_ERROR;
  readonly statusCode = 500;
  readonly isOperational = false; // Not operational - unexpected errors

  constructor(message = 'Internal server error', details?: unknown) {
    super(message, details);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  readonly code = ErrorCode.DATABASE_ERROR;
  readonly statusCode = 500;

  constructor(message: string, details?: unknown) {
    super(`Database error: ${message}`, details);
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  readonly code = ErrorCode.EXTERNAL_SERVICE_ERROR;
  readonly statusCode = 500;

  constructor(service: string, message: string, details?: unknown) {
    super(`${service} error: ${message}`, { service, ...details });
  }
}

/**
 * LiveKit service error
 */
export class LivekitError extends AppError {
  readonly code = ErrorCode.LIVEKIT_ERROR;
  readonly statusCode = 500;

  constructor(message: string, details?: unknown) {
    super(`LiveKit error: ${message}`, details);
  }
}

/**
 * SMS service error
 */
export class SmsServiceError extends AppError {
  readonly code = ErrorCode.SMS_SERVICE_ERROR;
  readonly statusCode = 500;

  constructor(message: string, details?: unknown) {
    super(`SMS service error: ${message}`, details);
  }
}

/**
 * Notification service error
 */
export class NotificationServiceError extends AppError {
  readonly code = ErrorCode.NOTIFICATION_SERVICE_ERROR;
  readonly statusCode = 500;

  constructor(message: string, details?: unknown) {
    super(`Notification service error: ${message}`, details);
  }
}
