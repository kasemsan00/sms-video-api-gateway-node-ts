/**
 * Generate Token Use Case
 * Generates a LiveKit access token for a user to join a room
 */

import { injectable, inject } from 'tsyringe';
import { GenerateTokenDto, GenerateTokenResponseDto } from '@application/dtos/index.js';
import { LiveKitAdapter } from '@infrastructure/adapters/livekit/livekit.adapter.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for generating LiveKit access token
 * Creates token with appropriate permissions for room access
 */
@injectable()
export class GenerateTokenUseCase {
  constructor(
    @inject(LiveKitAdapter) private livekitAdapter: LiveKitAdapter
  ) {}

  /**
   * Execute the use case
   * @param dto Generate token data transfer object
   * @returns Result containing token response or error
   */
  async execute(dto: GenerateTokenDto): Promise<Result<GenerateTokenResponseDto, AppError>> {
    try {
      logger.info('Generating LiveKit token', {
        room: dto.room,
        identity: dto.identity,
      });

      // Generate token using LiveKit adapter
      const tokenResult = await this.livekitAdapter.generateToken({
        roomName: dto.room,
        identity: dto.identity,
        name: dto.name,
        metadata: dto.metadata,
        canPublish: dto.canPublish ?? true,
        canSubscribe: dto.canSubscribe ?? true,
        canPublishData: dto.canPublishData ?? true,
      });

      if (tokenResult.isFailure) {
        logger.error('Failed to generate token', {
          room: dto.room,
          identity: dto.identity,
          error: tokenResult.error,
        });
        return failure(tokenResult.error);
      }

      const token = tokenResult.value;

      logger.info('Token generated successfully', {
        room: dto.room,
        identity: dto.identity,
      });

      // Map to response DTO
      const response: GenerateTokenResponseDto = {
        token,
        identity: dto.identity,
        room: dto.room,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generating token', { error: message, dto });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to generate token: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
