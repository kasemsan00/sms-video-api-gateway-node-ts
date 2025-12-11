/**
 * Close Room Use Case
 * Closes an existing room and optionally deletes the LiveKit room
 */

import { injectable, inject } from 'tsyringe';
import { CloseRoomDto, RoomResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { LiveKitAdapter } from '@infrastructure/adapters/livekit/livekit.adapter.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError, BusinessRuleViolationError, InternalServerError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for closing a room
 * Marks room as closed and optionally deletes LiveKit room
 */
@injectable()
export class CloseRoomUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository,
    @inject(LiveKitAdapter) private livekitAdapter: LiveKitAdapter
  ) {}

  /**
   * Execute the use case
   * @param dto Close room data transfer object
   * @returns Result containing room response or error
   */
  async execute(dto: CloseRoomDto): Promise<Result<RoomResponseDto, AppError>> {
    try {
      logger.info('Closing room', { roomName: dto.roomName });

      // Find room by name
      const room = await this.roomRepository.findByName(dto.roomName);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.roomName });
        return failure(new RoomNotFoundError(dto.roomName));
      }

      // Close the room
      const closeResult = room.close();
      if (closeResult.isFailure) {
        logger.error('Failed to close room', {
          roomName: dto.roomName,
          error: closeResult.error,
        });
        return failure(
          new BusinessRuleViolationError(
            closeResult.error.message,
            { details: closeResult.error }
          )
        );
      }

      // Update room in database
      const updatedRoom = await this.roomRepository.update(room);

      // Delete LiveKit room
      const livekitResult = await this.livekitAdapter.deleteRoom(dto.roomName);
      if (livekitResult.isFailure) {
        logger.error('Failed to delete LiveKit room', {
          roomName: dto.roomName,
          error: livekitResult.error,
        });
        // Don't fail the entire operation if LiveKit deletion fails
        // Room is already marked as closed in database
      } else {
        logger.info('LiveKit room deleted successfully', {
          roomName: dto.roomName,
        });
      }

      logger.info('Room closed successfully', {
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
      logger.error('Error closing room', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to close room: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
