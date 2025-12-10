/**
 * List Rooms Use Case
 * Retrieves a paginated list of rooms
 */

import { injectable, inject } from 'tsyringe';
import { ListRoomsDto, ListRoomsResponseDto, RoomResponseDto } from '@application/dtos/index.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for listing rooms with pagination
 * Queries repository and returns paginated results
 */
@injectable()
export class ListRoomsUseCase {
  constructor(
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  /**
   * Execute the use case
   * @param dto List rooms data transfer object
   * @returns Result containing paginated room list or error
   */
  async execute(dto: ListRoomsDto): Promise<Result<ListRoomsResponseDto, AppError>> {
    try {
      logger.info('Listing rooms', { dto });

      // Query repository with pagination
      const paginationParams = {
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        filters: dto.status ? { status: dto.status } : undefined,
      };

      const paginatedResult = await this.roomRepository.findAll(paginationParams);

      // Map rooms to response DTOs
      const items: RoomResponseDto[] = paginatedResult.items.map((room) => ({
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
      }));

      const response: ListRoomsResponseDto = {
        items,
        total: paginatedResult.total,
        page: paginatedResult.page,
        limit: paginatedResult.limit,
        totalPages: Math.ceil(paginatedResult.total / paginatedResult.limit),
        hasNext: paginatedResult.page < Math.ceil(paginatedResult.total / paginatedResult.limit),
        hasPrevious: paginatedResult.page > 1,
      };

      logger.info('Rooms listed successfully', {
        total: response.total,
        page: response.page,
        itemCount: items.length,
      });

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error listing rooms', { error: message, dto });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to list rooms: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
