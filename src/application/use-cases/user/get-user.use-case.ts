/**
 * Get User Use Case
 * Retrieves user details by identity
 */

import { injectable, inject } from 'tsyringe';
import { GetUserDto, UserResponseDto } from '@application/dtos/index.js';
import { IUserRepository } from '@domain/repositories/user.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, UserNotFoundError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for retrieving user details
 * Finds and returns user information by identity
 */
@injectable()
export class GetUserUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Get user data transfer object
   * @returns Result containing user response or error
   */
  async execute(dto: GetUserDto): Promise<Result<UserResponseDto, AppError>> {
    try {
      logger.info('Getting user details', { identity: dto.identity });

      // Find user by identity
      const user = await this.userRepository.findByIdentity(dto.identity);
      if (!user) {
        logger.warn('User not found', { identity: dto.identity });
        return failure(new UserNotFoundError(dto.identity));
      }

      logger.info('User found', { userId: user.id, identity: user.identity });

      // Map to response DTO
      const response: UserResponseDto = {
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
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting user', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to get user: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
