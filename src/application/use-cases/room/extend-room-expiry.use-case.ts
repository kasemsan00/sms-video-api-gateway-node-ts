/**
 * Extend Room Expiry Use Case
 * Extends the expiration date of a room
 */

import { injectable, inject } from 'tsyringe';
import { ExtendRoomExpiryDto, RoomResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError, BusinessRuleViolationError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for extending room expiry date
 * Adds specified number of days to room expiration
 */
@injectable()
export class ExtendRoomExpiryUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Extend room expiry data transfer object
   * @returns Result containing room response or error
   */
  async execute(dto: ExtendRoomExpiryDto): Promise<Result<RoomResponseDto, AppError>> {
    try {
      logger.info('Extending room expiry', {
        roomName: dto.roomName,
        days: dto.days,
      });

      // Find room by name
      const room = await this.roomRepository.findByName(dto.roomName);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.roomName });
        return failure(new RoomNotFoundError(dto.roomName));
      }

      // Extend room expiry
      const extendResult = room.extendExpiry(dto.days);
      if (extendResult.isFailure) {
        logger.error('Failed to extend room expiry', {
          roomName: dto.roomName,
          error: extendResult.error,
        });
        return failure(
          new BusinessRuleViolationError(
            extendResult.error.message,
            { details: extendResult.error }
          )
        );
      }

      // Update room in database
      const updatedRoom = await this.roomRepository.update(room);

      logger.info('Room expiry extended successfully', {
        roomId: updatedRoom.id,
        roomName: updatedRoom.name,
        newExpiryDate: updatedRoom.expiresAt,
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
      logger.error('Error extending room expiry', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to extend room expiry: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
