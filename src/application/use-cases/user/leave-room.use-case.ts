/**
 * Leave Room Use Case
 * User leaves a room by updating their status
 */

import { injectable, inject } from 'tsyringe';
import { LeaveRoomDto, UserResponseDto } from '@application/dtos/index.js';
import { IUserRepository } from '@domain/repositories/user.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, UserNotFoundError, InternalServerError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for user leaving a room
 * Marks user as left and offline
 */
@injectable()
export class LeaveRoomUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Leave room data transfer object
   * @returns Result containing user response or error
   */
  async execute(dto: LeaveRoomDto): Promise<Result<UserResponseDto, AppError>> {
    try {
      logger.info('User leaving room', {
        room: dto.room,
        identity: dto.identity,
      });

      // Find user by identity
      const user = await this.userRepository.findByIdentity(dto.identity);
      if (!user) {
        logger.warn('User not found', { identity: dto.identity });
        return failure(new UserNotFoundError(dto.identity));
      }

      // Mark user as left
      user.leave();

      // Update in database
      const updatedUser = await this.userRepository.update(user);

      logger.info('User left room successfully', {
        userId: updatedUser.id,
        identity: updatedUser.identity,
        room: dto.room,
      });

      // Map to response DTO
      const response: UserResponseDto = {
        id: updatedUser.id,
        room: updatedUser.room,
        identity: updatedUser.identity,
        name: updatedUser.name,
        userType: updatedUser.userType,
        mobile: updatedUser.mobile,
        metadata: updatedUser.metadata,
        color: updatedUser.color,
        isAdmin: updatedUser.isAdmin,
        isJoin: updatedUser.isJoin,
        isOnline: updatedUser.isOnline,
        isSpeaker: updatedUser.isSpeaker,
        isShareScreen: updatedUser.isShareScreen,
        isShareVideo: updatedUser.isShareVideo,
        isShareAudio: updatedUser.isShareAudio,
        isMobile: updatedUser.isMobile,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error leaving room', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to leave room: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
