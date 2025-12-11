/**
 * Get Messages Use Case
 * Retrieves chat messages for a room with pagination
 */

import { injectable, inject } from 'tsyringe';
import { GetMessagesDto, GetMessagesResponseDto, MessageResponseDto } from '@application/dtos/index.js';
import { IMessageRepository } from '@domain/repositories/message.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError, InternalServerError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for retrieving chat messages
 * Queries repository by room with pagination
 */
@injectable()
export class GetMessagesUseCase {
  constructor(
    @inject('IMessageRepository') private messageRepository: IMessageRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Get messages data transfer object
   * @returns Result containing paginated messages or error
   */
  async execute(dto: GetMessagesDto): Promise<Result<GetMessagesResponseDto, AppError>> {
    try {
      logger.info('Getting messages for room', {
        room: dto.room,
        page: dto.page,
        limit: dto.limit,
      });

      // Query messages with pagination
      const paginationParams = {
        page: dto.page ?? 1,
        limit: dto.limit ?? 50,
        filters: { room: dto.room },
      };

      const paginatedResult = await this.messageRepository.findByRoom(
        dto.room,
        paginationParams
      );

      logger.info('Messages retrieved successfully', {
        room: dto.room,
        total: paginatedResult.pagination.total,
        page: paginatedResult.pagination.page,
      });

      // Map to response DTOs
      const items: MessageResponseDto[] = paginatedResult.data.map((message) => ({
        id: message.id,
        room: message.room,
        identity: message.identity,
        name: message.name,
        message: message.message,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      }));

      const response: GetMessagesResponseDto = {
        items,
        total: paginatedResult.pagination.total,
        page: paginatedResult.pagination.page,
        limit: paginatedResult.pagination.limit,
        totalPages: paginatedResult.pagination.totalPages,
        hasNext: paginatedResult.pagination.hasNextPage,
        hasPrevious: paginatedResult.pagination.hasPrevPage,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting messages', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to get messages: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
