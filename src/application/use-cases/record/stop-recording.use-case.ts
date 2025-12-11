/**
 * Stop Recording Use Case
 * Stops an active room recording
 */

import { injectable, inject } from 'tsyringe';
import { StopRecordingDto, RecordingResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { LiveKitAdapter } from '@infrastructure/adapters/livekit/livekit.adapter.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError, BusinessRuleViolationError, InvalidInputError, InternalServerError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { RecordingStatus } from '@application/dtos/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for stopping room recording
 * Stops recording via LiveKit and clears room recordId
 */
@injectable()
export class StopRecordingUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository,
    @inject(LiveKitAdapter) private livekitAdapter: LiveKitAdapter
  ) {}

  /**
   * Execute the use case
   * @param dto Stop recording data transfer object
   * @returns Result containing recording response or error
   */
  async execute(dto: StopRecordingDto): Promise<Result<RecordingResponseDto, AppError>> {
    try {
      logger.info('Stopping room recording', {
        room: dto.room,
        egressId: dto.egressId,
      });

      // Verify room exists
      const room = await this.roomRepository.findByName(dto.room);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.room });
        return failure(new RoomNotFoundError(dto.room));
      }

      // Check if room has active recording
      if (!room.recordId) {
        logger.warn('Room is not being recorded', { room: dto.room });
        return failure(
          new BusinessRuleViolationError('Room is not being recorded')
        );
      }

      // Verify egressId matches room's recordId
      if (room.recordId !== dto.egressId) {
        logger.warn('EgressId mismatch', {
          room: dto.room,
          providedEgressId: dto.egressId,
          roomRecordId: room.recordId,
        });
        return failure(
          new InvalidInputError('egressId', 'EgressId does not match room recording')
        );
      }

      // Stop recording via LiveKit
      const stopResult = await this.livekitAdapter.stopRecording(dto.egressId);

      if (stopResult.isFailure) {
        logger.error('Failed to stop recording', {
          room: dto.room,
          egressId: dto.egressId,
          error: stopResult.error,
        });
        return failure(stopResult.error);
      }

      // Clear room recordId
      room.setRecordId('');
      await this.roomRepository.update(room);

      logger.info('Recording stopped successfully', {
        room: dto.room,
        egressId: dto.egressId,
      });

      // Map to response DTO
      const response: RecordingResponseDto = {
        id: 0, // Will be set by database if persisted
        egressId: dto.egressId,
        room: dto.room,
        status: RecordingStatus.COMPLETED,
        completedAt: new Date(),
        createdAt: new Date(),
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error stopping recording', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to stop recording: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
