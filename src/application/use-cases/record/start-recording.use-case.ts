/**
 * Start Recording Use Case
 * Starts recording a room session
 */

import { injectable, inject } from 'tsyringe';
import { EncodingOptionsPreset } from 'livekit-server-sdk';
import { StartRecordingDto, StartRecordingResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { LiveKitAdapter } from '@infrastructure/adapters/livekit/livekit.adapter.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError, BusinessRuleViolationError, InternalServerError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { RecordingStatus } from '@application/dtos/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for starting room recording
 * Initiates recording via LiveKit and updates room with recordId
 */
@injectable()
export class StartRecordingUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository,
    @inject(LiveKitAdapter) private livekitAdapter: LiveKitAdapter
  ) {}

  /**
   * Execute the use case
   * @param dto Start recording data transfer object
   * @returns Result containing recording response or error
   */
  async execute(dto: StartRecordingDto): Promise<Result<StartRecordingResponseDto, AppError>> {
    try {
      logger.info('Starting room recording', { room: dto.room });

      // Verify room exists
      const room = await this.roomRepository.findByName(dto.room);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.room });
        return failure(new RoomNotFoundError(dto.room));
      }

      // Check if room is already recording
      if (room.recordId) {
        logger.warn('Room is already being recorded', {
          room: dto.room,
          existingRecordId: room.recordId,
        });
        return failure(
          new BusinessRuleViolationError(
            'Room is already being recorded',
            { recordId: room.recordId }
          )
        );
      }

      // Map preset string to EncodingOptionsPreset enum
      let preset: EncodingOptionsPreset | undefined;
      if (dto.preset) {
        const presetMap: Record<string, EncodingOptionsPreset> = {
          'H264_720P_30': EncodingOptionsPreset.H264_720P_30,
          'H264_1080P_30': EncodingOptionsPreset.H264_1080P_30,
          'H264_720P_60': EncodingOptionsPreset.H264_720P_60,
          'H264_1080P_60': EncodingOptionsPreset.H264_1080P_60,
        };
        preset = presetMap[dto.preset];
      }

      // Start recording via LiveKit
      const recordingResult = await this.livekitAdapter.startRecording({
        roomName: dto.room,
        fileOutputPrefix: dto.filePrefix || `recordings/${dto.room}`,
        preset,
      });

      if (recordingResult.isFailure) {
        logger.error('Failed to start recording', {
          room: dto.room,
          error: recordingResult.error,
        });
        return failure(recordingResult.error);
      }

      const egressId = recordingResult.value;

      // Update room with recording ID
      room.setRecordId(egressId);
      await this.roomRepository.update(room);

      logger.info('Recording started successfully', {
        room: dto.room,
        egressId,
      });

      // Map to response DTO
      const response: StartRecordingResponseDto = {
        egressId,
        room: dto.room,
        status: RecordingStatus.ACTIVE,
        startedAt: new Date(),
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error starting recording', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to start recording: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
