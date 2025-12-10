/**
 * Error exports
 * Central export point for all error classes
 */

// Base error
export { AppError } from './base.error.js';

// Domain errors
export {
  DomainError,
  RoomNotFoundError,
  RoomExpiredError,
  RoomClosedError,
  RoomAlreadyClosedError,
  RoomAlreadyExistsError,
  MaxParticipantsReachedError,
  UserNotFoundError,
  UserAlreadyInRoomError,
  LinkNotFoundError,
  LinkExpiredError,
  OneTimeLinkUsedError,
  CaseNotFoundError,
  MessageNotFoundError,
  BusinessRuleViolationError,
} from './domain.errors.js';

// Validation errors
export {
  ValidationError,
  InvalidInputError,
  InvalidFormatError,
  MissingRequiredFieldError,
  ZodValidationError,
} from './validation.errors.js';

// HTTP errors
export {
  UnauthorizedError,
  InvalidTokenError,
  TokenExpiredError,
  InvalidCredentialsError,
  ForbiddenError,
  InsufficientPermissionsError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  DatabaseError,
  ExternalServiceError,
  LivekitError,
  SmsServiceError,
  NotificationServiceError,
} from './http.errors.js';
