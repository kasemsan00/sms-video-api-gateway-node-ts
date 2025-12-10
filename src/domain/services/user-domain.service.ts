/**
 * User Domain Service
 * Contains business logic for user operations
 */

import { User } from '../entities/user.entity.js';
import { Result, success, failure } from '@shared/types/index.js';
import { DomainError } from '@shared/errors/index.js';
import { UserType, ErrorCode } from '@shared/constants/index.js';

export class UserDomainService {
  /**
   * Check if a user has admin privileges
   */
  static isUserAdmin(user: User): boolean {
    return user.isAdmin || user.userType === UserType.ADMIN;
  }

  /**
   * Check if a user can remove another user
   */
  static canRemoveUser(
    remover: User,
    target: User
  ): Result<void, DomainError> {
    if (!UserDomainService.isUserAdmin(remover)) {
      return failure(
        new DomainError(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          'Only admins can remove users'
        )
      );
    }

    if (UserDomainService.isUserAdmin(target)) {
      return failure(
        new DomainError(ErrorCode.CANNOT_REMOVE_ADMIN, 'Cannot remove admin users')
      );
    }

    if (remover.identity === target.identity) {
      return failure(
        new DomainError(ErrorCode.CANNOT_REMOVE_SELF, 'Cannot remove yourself')
      );
    }

    return success(undefined);
  }

  /**
   * Check if a user can modify room settings
   */
  static canModifyRoomSettings(user: User): Result<void, DomainError> {
    if (!UserDomainService.isUserAdmin(user)) {
      return failure(
        new DomainError(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          'Only admins can modify room settings'
        )
      );
    }

    return success(undefined);
  }

  /**
   * Determine user's default permissions based on type
   */
  static getDefaultPermissions(userType: UserType): {
    canShareScreen: boolean;
    canShareVideo: boolean;
    canShareAudio: boolean;
    canSendChat: boolean;
  } {
    switch (userType) {
      case UserType.ADMIN:
        return {
          canShareScreen: true,
          canShareVideo: true,
          canShareAudio: true,
          canSendChat: true,
        };
      case UserType.USER:
        return {
          canShareScreen: true,
          canShareVideo: true,
          canShareAudio: true,
          canSendChat: true,
        };
      case UserType.VIEWER:
        return {
          canShareScreen: false,
          canShareVideo: false,
          canShareAudio: false,
          canSendChat: true,
        };
      default:
        return {
          canShareScreen: false,
          canShareVideo: false,
          canShareAudio: false,
          canSendChat: false,
        };
    }
  }

  /**
   * Validate user identity uniqueness in room
   */
  static isIdentityUniqueInRoom(
    identity: string,
    existingUsers: User[]
  ): boolean {
    return !existingUsers.some((user) => user.identity === identity);
  }

  /**
   * Generate unique identity for anonymous user
   */
  static generateAnonymousIdentity(existingUsers: User[]): string {
    let counter = 1;
    let identity = `anonymous_${counter}`;

    while (!UserDomainService.isIdentityUniqueInRoom(identity, existingUsers)) {
      counter++;
      identity = `anonymous_${counter}`;
    }

    return identity;
  }
}
