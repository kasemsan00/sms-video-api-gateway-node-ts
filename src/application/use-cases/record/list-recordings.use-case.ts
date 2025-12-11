/**
 * List Recordings Use Case
 * Retrieves all recordings for a room with pagination
 */

import { injectable } from 'tsyringe';
import { ListRecordingsDto, ListRecordingsResponseDto, RecordingResponseDto } from '@application/dtos/index.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for listing room recordings
 * Queries recordings repository with pagination
 * Note: This is a placeholder implementation that returns empty results
 * In a full implementation, this would query a recordings repository
 */
@injectable()
export class ListRecordingsUseCase {
  constructor() {}

  /**
   * Execute the use case
   * @param dto List recordings data transfer object
   * @returns Result containing paginated recordings list or error
   */
  async execute(dto: ListRecordingsDto): Promise<Result<ListRecordingsResponseDto, AppError>> {
    try {
      logger.info('Listing recordings for room', {
        room: dto.room,
        page: dto.page,
        limit: dto.limit,
      });

      // TODO: In a full implementation, query from recordings repository
      // For now, return an empty list
      logger.warn('List recordings is not fully implemented - returning empty list');

      const items: RecordingResponseDto[] = [];
      const total = 0;
      const page = dto.page ?? 1;
      const limit = dto.limit ?? 20;

      const response: ListRecordingsResponseDto = {
        items,
        total,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      logger.info('Recordings listed successfully', {
        room: dto.room,
        total: response.total,
        page: response.page,
      });

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error listing recordings', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to list recordings: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
