/**
 * Join Room Use Case
 * User joins a room by creating or updating their user record
 */

import { injectable, inject } from 'tsyringe';
import { JoinRoomDto, UserResponseDto } from '@application/dtos/index.js';
import { IUserRepository } from '@domain/repositories/user.repository.interface.js';
import { User } from '@domain/entities/user.entity.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for user joining a room
 * Creates or updates user entity and marks as joined
 */
@injectable()
export class JoinRoomUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Join room data transfer object
   * @returns Result containing user response or error
   */
  async execute(dto: JoinRoomDto): Promise<Result<UserResponseDto, AppError>> {
    try {
      logger.info('User joining room', {
        room: dto.room,
        identity: dto.identity,
      });

      // Check if user already exists
      let user = await this.userRepository.findByIdentity(dto.identity);

      if (user) {
        // User exists, mark as joined
        user.join();
        user = await this.userRepository.update(user);

        logger.info('Existing user joined room', {
          userId: user.id,
          identity: user.identity,
          room: dto.room,
        });
      } else {
        // Create new user
        const userResult = User.create({
          room: dto.room,
          identity: dto.identity,
          name: dto.name,
          userType: dto.userType,
          metadata: dto.metadata,
        });

        if (userResult.isFailure) {
          logger.error('Failed to create user entity', {
            error: userResult.error,
          });
          return failure(
            new AppError(
              ErrorCode.VALIDATION_ERROR,
              userResult.error.message,
              400,
              { details: userResult.error }
            )
          );
        }

        user = userResult.value;

        // Mark as joined
        user.join();

        // Save to database
        user = await this.userRepository.create(user);

        logger.info('New user created and joined room', {
          userId: user.id,
          identity: user.identity,
          room: dto.room,
        });
      }

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
      logger.error('Error joining room', { error: message, dto });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to join room: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
