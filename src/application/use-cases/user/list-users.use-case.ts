/**
 * List Users Use Case
 * Retrieves all users in a room, optionally filtered by online status
 */

import { injectable, inject } from 'tsyringe';
import { ListUsersDto, UserResponseDto } from '@application/dtos/index.js';
import { IUserRepository } from '@domain/repositories/user.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for listing users in a room
 * Queries repository by room name with optional online filter
 */
@injectable()
export class ListUsersUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case
   * @param dto List users data transfer object
   * @returns Result containing array of user responses or error
   */
  async execute(dto: ListUsersDto): Promise<Result<UserResponseDto[], AppError>> {
    try {
      logger.info('Listing users in room', {
        room: dto.room,
        onlineOnly: dto.onlineOnly,
      });

      // Query users by room
      let users = await this.userRepository.findByRoom(dto.room);

      // Filter online users if requested
      if (dto.onlineOnly) {
        users = users.filter((user) => user.isOnline);
      }

      logger.info('Users listed successfully', {
        room: dto.room,
        totalUsers: users.length,
        onlineOnly: dto.onlineOnly,
      });

      // Map to response DTOs
      const response: UserResponseDto[] = users.map((user) => ({
        id: user.id,
        room: user.room,
        identity: user.identity,
        name: user.name,
        userType: user.userType,
        mobile: user.mobile,
        metadata: user.metadata,
        color: user.color,
        isAdmin: user.isAdmin,
        isJoin: user.isJoin,
        isOnline: user.isOnline,
        isSpeaker: user.isSpeaker,
        isShareScreen: user.isShareScreen,
        isShareVideo: user.isShareVideo,
        isShareAudio: user.isShareAudio,
        isMobile: user.isMobile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error listing users', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to list users: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
