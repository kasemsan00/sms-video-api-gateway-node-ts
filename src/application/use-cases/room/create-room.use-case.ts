/**
 * Create Room Use Case
 * Creates a new video conference room
 */

import { injectable, inject } from 'tsyringe';
import { CreateRoomDto, RoomResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { Room } from '@domain/entities/room.entity.js';
import { LiveKitAdapter } from '@infrastructure/adapters/livekit/livekit.adapter.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomAlreadyExistsError, ValidationError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for creating a new room
 * Creates room entity, saves to database, and optionally creates LiveKit room
 */
@injectable()
export class CreateRoomUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository,
    @inject(LiveKitAdapter) private livekitAdapter: LiveKitAdapter
  ) {}

  /**
   * Execute the use case
   * @param dto Create room data transfer object
   * @returns Result containing room response or error
   */
  async execute(dto: CreateRoomDto): Promise<Result<RoomResponseDto, AppError>> {
    try {
      logger.info('Creating new room', { dto });

      // Create room entity
      const roomResult = Room.create({
        name: dto.name,
        service: dto.service,
        linkType: dto.linkType,
        autoRecord: dto.autoRecord,
        chatEnabled: dto.chatEnabled,
        webSocketURL: dto.webSocketURL,
        userAgent: dto.userAgent,
      });

      if (roomResult.isFailure) {
        logger.error('Failed to create room entity', { error: roomResult.error });
        return failure(
          new ValidationError(
            roomResult.error.message,
            { details: roomResult.error }
          )
        );
      }

      const room = roomResult.value;

      // Check if room name already exists
      const existingRoom = await this.roomRepository.findByName(room.name);
      if (existingRoom) {
        logger.warn('Room already exists', { roomName: room.name });
        return failure(new RoomAlreadyExistsError(room.name));
      }

      // Save room to database
      const savedRoom = await this.roomRepository.create(room);

      // Create LiveKit room if room type is conference
      if (room.isOpen()) {
        const livekitResult = await this.livekitAdapter.createRoom({
          name: savedRoom.name,
          emptyTimeout: 300, // 5 minutes
          maxParticipants: 50,
        });

        if (livekitResult.isFailure) {
          logger.error('Failed to create LiveKit room', {
            roomName: savedRoom.name,
            error: livekitResult.error,
          });
          // Don't fail the entire operation if LiveKit fails
          // Room is already created in database
        } else {
          logger.info('LiveKit room created successfully', {
            roomName: savedRoom.name,
          });
        }
      }

      logger.info('Room created successfully', {
        roomId: savedRoom.id,
        roomName: savedRoom.name,
      });

      // Map to response DTO
      const response: RoomResponseDto = {
        id: savedRoom.id,
        name: savedRoom.name,
        status: savedRoom.status,
        roomType: savedRoom.roomType,
        service: savedRoom.service,
        autoRecord: savedRoom.autoRecord,
        chatEnabled: savedRoom.chatEnabled,
        recordId: savedRoom.recordId,
        messageUnread: savedRoom.messageUnread,
        webSocketURL: savedRoom.webSocketURL,
        userAgent: savedRoom.userAgent,
        createdAt: savedRoom.createdAt,
        updatedAt: savedRoom.updatedAt,
        expiresAt: savedRoom.expiresAt,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating room', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to create room: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
