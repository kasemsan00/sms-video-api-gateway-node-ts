/**
 * Get Room Use Case
 * Retrieves room details by name
 */

import { injectable, inject } from 'tsyringe';
import { GetRoomDto, RoomResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for retrieving room details
 * Finds and returns room information by name
 */
@injectable()
export class GetRoomUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Get room data transfer object
   * @returns Result containing room response or error
   */
  async execute(dto: GetRoomDto): Promise<Result<RoomResponseDto, AppError>> {
    try {
      logger.info('Getting room details', { roomName: dto.roomName });

      // Find room by name
      const room = await this.roomRepository.findByName(dto.roomName);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.roomName });
        return failure(new RoomNotFoundError(dto.roomName));
      }

      logger.info('Room found', { roomId: room.id, roomName: room.name });

      // Map to response DTO
      const response: RoomResponseDto = {
        id: room.id,
        name: room.name,
        status: room.status,
        roomType: room.roomType,
        service: room.service,
        autoRecord: room.autoRecord,
        chatEnabled: room.chatEnabled,
        recordId: room.recordId,
        messageUnread: room.messageUnread,
        webSocketURL: room.webSocketURL,
        userAgent: room.userAgent,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        expiresAt: room.expiresAt,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting room', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to get room: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
