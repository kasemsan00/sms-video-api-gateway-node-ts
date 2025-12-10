/**
 * Room Domain Service
 * Contains business logic that doesn't naturally fit within a single entity
 */

import { Room } from '../entities/room.entity.js';
import { User } from '../entities/user.entity.js';
import { Result, success, failure } from '@shared/types/index.js';
import { DomainError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';

export class RoomDomainService {
  /**
   * Check if a user can join a room
   */
  static canUserJoinRoom(room: Room, _user: User): Result<void, DomainError> {
    if (room.isClosed()) {
      return failure(
        new DomainError(ErrorCode.ROOM_CLOSED, 'Cannot join a closed room')
      );
    }

    if (room.isExpired()) {
      return failure(
        new DomainError(ErrorCode.ROOM_EXPIRED, 'Cannot join an expired room')
      );
    }

    return success(undefined);
  }

  /**
   * Check if a room can be closed
   */
  static canCloseRoom(room: Room): Result<void, DomainError> {
    if (room.isClosed()) {
      return failure(
        new DomainError(ErrorCode.ROOM_ALREADY_CLOSED, 'Room is already closed')
      );
    }

    return success(undefined);
  }

  /**
   * Check if a room can be reopened
   */
  static canReopenRoom(room: Room): Result<void, DomainError> {
    if (room.isOpen()) {
      return failure(
        new DomainError(ErrorCode.ROOM_ALREADY_OPEN, 'Room is already open')
      );
    }

    if (room.isExpired()) {
      return failure(
        new DomainError(ErrorCode.ROOM_EXPIRED, 'Cannot reopen an expired room')
      );
    }

    return success(undefined);
  }

  /**
   * Determine if a room should auto-close based on participant count
   */
  static shouldAutoClose(
    room: Room,
    participantCount: number,
    emptyDurationMinutes: number
  ): boolean {
    return (
      room.isOpen() &&
      participantCount === 0 &&
      emptyDurationMinutes >= 10
    );
  }

  /**
   * Calculate room expiry extension
   */
  static calculateExpiryExtension(
    currentExpiry: Date,
    extensionDays: number
  ): Date {
    return new Date(
      currentExpiry.getTime() + extensionDays * 24 * 60 * 60 * 1000
    );
  }

  /**
   * Validate room name uniqueness requirement
   */
  static isRoomNameValid(name: string): boolean {
    return (
      typeof name === 'string' &&
      name.length >= 1 &&
      name.length <= 50 &&
      /^[a-zA-Z0-9]+$/.test(name)
    );
  }
}
