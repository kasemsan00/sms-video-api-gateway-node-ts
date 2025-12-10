/**
 * Get Recording Use Case
 * Retrieves recording details by egressId
 */

import { injectable, inject } from 'tsyringe';
import { GetRecordingDto, RecordingResponseDto } from '@application/dtos/index.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';
import { ErrorCode, RecordingStatus } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for retrieving recording details
 * Gets recording information from database or LiveKit
 * Note: This is a placeholder implementation that returns mock data
 * In a full implementation, this would query a recordings repository
 */
@injectable()
export class GetRecordingUseCase {
  constructor() {}

  /**
   * Execute the use case
   * @param dto Get recording data transfer object
   * @returns Result containing recording response or error
   */
  async execute(dto: GetRecordingDto): Promise<Result<RecordingResponseDto, AppError>> {
    try {
      logger.info('Getting recording details', { egressId: dto.egressId });

      // TODO: In a full implementation, query from recordings repository
      // For now, return a placeholder response
      logger.warn('Get recording is not fully implemented - returning placeholder data');

      // Map to response DTO
      const response: RecordingResponseDto = {
        id: 0,
        egressId: dto.egressId,
        room: 'unknown',
        status: RecordingStatus.PENDING,
        createdAt: new Date(),
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error getting recording', { error: message, dto });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to get recording: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
