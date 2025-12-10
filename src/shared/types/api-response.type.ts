/**
 * Standardized API response types
 */

import type { PaginationMeta } from './pagination.type.js';

/**
 * Standardized API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * Error information in API response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string; // Only in development environment
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

/**
 * Factory function for success responses
 *
 * @example
 * ```typescript
 * return res.json(successResponse({ id: 1, name: 'Test' }));
 * ```
 */
export const successResponse = <T>(
  data: T,
  meta?: Partial<ResponseMeta>
): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta,
  },
});

/**
 * Factory function for error responses
 *
 * @example
 * ```typescript
 * return res.status(400).json(errorResponse({
 *   code: 'VALIDATION_ERROR',
 *   message: 'Invalid input'
 * }));
 * ```
 */
export const errorResponse = (
  error: ApiError,
  meta?: Partial<ResponseMeta>
): ApiResponse<never> => ({
  success: false,
  error,
  meta: {
    timestamp: new Date().toISOString(),
    ...meta,
  },
});

/**
 * Factory function for paginated responses
 *
 * @example
 * ```typescript
 * return res.json(paginatedResponse(data, paginationMeta));
 * ```
 */
export const paginatedResponse = <T>(
  data: T[],
  pagination: PaginationMeta
): ApiResponse<T[]> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    pagination,
  },
});
