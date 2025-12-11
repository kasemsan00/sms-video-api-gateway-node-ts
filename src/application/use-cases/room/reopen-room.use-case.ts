/**
 * Reopen Room Use Case
 * Reopens a previously closed room
 */

import { injectable, inject } from 'tsyringe';
import { ReopenRoomDto, RoomResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { LiveKitAdapter } from '@infrastructure/adapters/livekit/livekit.adapter.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError, BusinessRuleViolationError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for reopening a closed room
 * Marks room as open and creates LiveKit room if needed
 */
@injectable()
export class ReopenRoomUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository,
    @inject(LiveKitAdapter) private livekitAdapter: LiveKitAdapter
  ) {}

  /**
   * Execute the use case
   * @param dto Reopen room data transfer object
   * @returns Result containing room response or error
   */
  async execute(dto: ReopenRoomDto): Promise<Result<RoomResponseDto, AppError>> {
    try {
      logger.info('Reopening room', { roomName: dto.roomName });

      // Find room by name
      const room = await this.roomRepository.findByName(dto.roomName);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.roomName });
        return failure(new RoomNotFoundError(dto.roomName));
      }

      // Reopen the room
      const reopenResult = room.reopen();
      if (reopenResult.isFailure) {
        logger.error('Failed to reopen room', {
          roomName: dto.roomName,
          error: reopenResult.error,
        });
        return failure(
          new BusinessRuleViolationError(
            reopenResult.error.message,
            { details: reopenResult.error }
          )
        );
      }

      // Update room in database
      const updatedRoom = await this.roomRepository.update(room);

      // Create LiveKit room
      const livekitResult = await this.livekitAdapter.createRoom({
        name: dto.roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 50,
      });

      if (livekitResult.isFailure) {
        logger.error('Failed to create LiveKit room', {
          roomName: dto.roomName,
          error: livekitResult.error,
        });
        // Don't fail the entire operation if LiveKit fails
        // Room is already reopened in database
      } else {
        logger.info('LiveKit room created successfully', {
          roomName: dto.roomName,
        });
      }

      logger.info('Room reopened successfully', {
        roomId: updatedRoom.id,
        roomName: updatedRoom.name,
      });

      // Map to response DTO
      const response: RoomResponseDto = {
        id: updatedRoom.id,
        name: updatedRoom.name,
        status: updatedRoom.status,
        roomType: updatedRoom.roomType,
        service: updatedRoom.service,
        autoRecord: updatedRoom.autoRecord,
        chatEnabled: updatedRoom.chatEnabled,
        recordId: updatedRoom.recordId,
        messageUnread: updatedRoom.messageUnread,
        webSocketURL: updatedRoom.webSocketURL,
        userAgent: updatedRoom.userAgent,
        createdAt: updatedRoom.createdAt,
        updatedAt: updatedRoom.updatedAt,
        expiresAt: updatedRoom.expiresAt,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error reopening room', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to reopen room: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
