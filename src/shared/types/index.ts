/**
 * Shared types exports
 * Central export point for all shared type definitions
 */

// Common types
export type {
  UUID,
  DateTimeString,
  Timestamp,
  Nullable,
  Optional,
  Maybe,
  RoomId,
  UserId,
  LinkId,
  MessageId,
  ServiceId,
  CaseId,
  Dictionary,
  AsyncFunction,
  Callback,
  ErrorCallback,
} from './common.types.js';

export { createBrand } from './common.types.js';

// Result type
export type { Result } from './result.type.js';
export {
  Success,
  Failure,
  success,
  failure,
  isSuccess,
  isFailure,
  combine,
  fromPromise,
  tryCatch,
} from './result.type.js';

// Pagination types
export type {
  PaginationParams,
  PaginationMeta,
  PaginatedResult,
} from './pagination.type.js';

export {
  createPaginatedResult,
  DEFAULT_PAGINATION,
  validatePaginationParams,
  calculateOffset,
} from './pagination.type.js';

// API Response types
export type {
  ApiResponse,
  ApiError,
  ResponseMeta,
} from './api-response.type.js';

export {
  successResponse,
  errorResponse,
  paginatedResponse,
} from './api-response.type.js';
