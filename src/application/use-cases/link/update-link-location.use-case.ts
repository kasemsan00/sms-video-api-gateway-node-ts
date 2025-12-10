/**
 * Update Link Location Use Case
 * Updates GPS coordinates for a location tracking link
 */

import { injectable, inject } from 'tsyringe';
import { UpdateLinkLocationDto, LinkResponseDto } from '@application/dtos/index.js';
import { ILinkRepository } from '@domain/repositories/link.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, LinkNotFoundError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for updating link location
 * Updates latitude, longitude, and accuracy for location links
 */
@injectable()
export class UpdateLinkLocationUseCase {
  constructor(
    @inject('ILinkRepository') private linkRepository: ILinkRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Update link location data transfer object
   * @returns Result containing link response or error
   */
  async execute(dto: UpdateLinkLocationDto): Promise<Result<LinkResponseDto, AppError>> {
    try {
      logger.info('Updating link location', {
        linkId: dto.linkId,
        latitude: dto.latitude,
        longitude: dto.longitude,
      });

      // Find link by linkId
      const link = await this.linkRepository.findByLinkId(dto.linkId);
      if (!link) {
        logger.warn('Link not found', { linkId: dto.linkId });
        return failure(new LinkNotFoundError(dto.linkId));
      }

      // Update location
      const updateResult = link.updateLocation(
        dto.latitude,
        dto.longitude,
        dto.accuracy
      );

      if (updateResult.isFailure) {
        logger.error('Failed to update link location', {
          linkId: dto.linkId,
          error: updateResult.error,
        });
        return failure(
          new AppError(
            ErrorCode.BUSINESS_RULE_VIOLATION,
            updateResult.error.message,
            400,
            { details: updateResult.error }
          )
        );
      }

      // Update link in database
      const updatedLink = await this.linkRepository.update(link);

      logger.info('Link location updated successfully', {
        linkId: updatedLink.linkId,
        latitude: updatedLink.latitude,
        longitude: updatedLink.longitude,
      });

      // Build full URL
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const url = `${baseUrl}/join/${updatedLink.linkId}`;

      // Map to response DTO
      const response: LinkResponseDto = {
        linkId: updatedLink.linkId,
        room: updatedLink.room,
        mobile: updatedLink.mobile,
        userType: updatedLink.userType,
        linkType: updatedLink.linkType,
        userName: updatedLink.userName,
        isAdmin: updatedLink.isAdmin,
        requireJoinPermission: updatedLink.requireJoinPermission,
        requireUserName: updatedLink.requireUserName,
        oneTimeLink: updatedLink.oneTimeLink,
        isUsed: updatedLink.isUsed,
        latitude: updatedLink.latitude,
        longitude: updatedLink.longitude,
        accuracy: updatedLink.accuracy,
        createdAt: updatedLink.createdAt,
        updatedAt: updatedLink.updatedAt,
        expiresAt: updatedLink.expiresAt,
        url,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating link location', { error: message, dto });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to update link location: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
