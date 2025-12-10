/**
 * Domain-specific errors
 * Business logic and domain rule violations
 */

import { AppError } from './base.error.js';
import { ErrorCode, ERROR_CODE_TO_HTTP_STATUS } from '../constants/error-codes.constant.js';

/**
 * Base domain error class
 */
export class DomainError extends AppError {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message, details);
  }

  get statusCode(): number {
    return ERROR_CODE_TO_HTTP_STATUS[this.code];
  }
}

/**
 * Room-related domain errors
 */
export class RoomNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(
      ErrorCode.ROOM_NOT_FOUND,
      `Room '${identifier}' not found`,
      { identifier }
    );
  }
}

export class RoomExpiredError extends DomainError {
  constructor(roomName: string, expiryDate: Date) {
    super(
      ErrorCode.ROOM_EXPIRED,
      `Room '${roomName}' has expired`,
      { roomName, expiryDate: expiryDate.toISOString() }
    );
  }
}

export class RoomClosedError extends DomainError {
  constructor(roomName: string) {
    super(
      ErrorCode.ROOM_CLOSED,
      `Room '${roomName}' is closed`,
      { roomName }
    );
  }
}

export class RoomAlreadyClosedError extends DomainError {
  constructor(roomName: string) {
    super(
      ErrorCode.ROOM_ALREADY_CLOSED,
      `Room '${roomName}' is already closed`,
      { roomName }
    );
  }
}

export class RoomAlreadyExistsError extends DomainError {
  constructor(roomName: string) {
    super(
      ErrorCode.ROOM_ALREADY_EXISTS,
      `Room '${roomName}' already exists`,
      { roomName }
    );
  }
}

export class MaxParticipantsReachedError extends DomainError {
  constructor(roomName: string, maxParticipants: number) {
    super(
      ErrorCode.MAX_PARTICIPANTS_REACHED,
      `Room '${roomName}' has reached maximum participant limit`,
      { roomName, maxParticipants }
    );
  }
}

/**
 * User-related domain errors
 */
export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(
      ErrorCode.USER_NOT_FOUND,
      `User '${identifier}' not found`,
      { identifier }
    );
  }
}

export class UserAlreadyInRoomError extends DomainError {
  constructor(identity: string, roomName: string) {
    super(
      ErrorCode.USER_ALREADY_IN_ROOM,
      `User '${identity}' is already in room '${roomName}'`,
      { identity, roomName }
    );
  }
}

/**
 * Link-related domain errors
 */
export class LinkNotFoundError extends DomainError {
  constructor(linkId: string) {
    super(
      ErrorCode.LINK_NOT_FOUND,
      `Link '${linkId}' not found`,
      { linkId }
    );
  }
}

export class LinkExpiredError extends DomainError {
  constructor(linkId: string, expiryDate: Date) {
    super(
      ErrorCode.LINK_EXPIRED,
      `Link '${linkId}' has expired`,
      { linkId, expiryDate: expiryDate.toISOString() }
    );
  }
}

export class OneTimeLinkUsedError extends DomainError {
  constructor(linkId: string) {
    super(
      ErrorCode.ONE_TIME_LINK_USED,
      `One-time link '${linkId}' has already been used`,
      { linkId }
    );
  }
}

/**
 * Case-related domain errors
 */
export class CaseNotFoundError extends DomainError {
  constructor(caseId: string | number) {
    super(
      ErrorCode.CASE_NOT_FOUND,
      `Case '${caseId}' not found`,
      { caseId }
    );
  }
}

/**
 * Message-related domain errors
 */
export class MessageNotFoundError extends DomainError {
  constructor(messageId: number) {
    super(
      ErrorCode.MESSAGE_NOT_FOUND,
      `Message '${messageId}' not found`,
      { messageId }
    );
  }
}

/**
 * Generic business rule violation
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, details);
  }
}
