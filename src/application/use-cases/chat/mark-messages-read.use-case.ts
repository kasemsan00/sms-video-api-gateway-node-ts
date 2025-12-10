/**
 * Mark Messages Read Use Case
 * Marks all messages in a room as read by clearing the unread count
 */

import { injectable, inject } from 'tsyringe';
import { MarkMessagesReadDto, RoomResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for marking messages as read
 * Clears the room's unread message count
 */
@injectable()
export class MarkMessagesReadUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Mark messages read data transfer object
   * @returns Result containing room response or error
   */
  async execute(dto: MarkMessagesReadDto): Promise<Result<RoomResponseDto, AppError>> {
    try {
      logger.info('Marking messages as read', { room: dto.room });

      // Find room by name
      const room = await this.roomRepository.findByName(dto.room);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.room });
        return failure(new RoomNotFoundError(dto.room));
      }

      // Clear unread messages
      room.clearUnreadMessages();

      // Update room in database
      const updatedRoom = await this.roomRepository.update(room);

      logger.info('Messages marked as read successfully', {
        roomId: updatedRoom.id,
        room: dto.room,
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
      logger.error('Error marking messages as read', { error: message, dto });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to mark messages as read: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
