/**
 * Mark Link Used Use Case
 * Marks a one-time link as used
 */

import { injectable, inject } from 'tsyringe';
import { MarkLinkUsedDto, LinkResponseDto } from '@application/dtos/index.js';
import { ILinkRepository } from '@domain/repositories/link.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, LinkNotFoundError, BusinessRuleViolationError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for marking link as used
 * Updates link status for one-time use links
 */
@injectable()
export class MarkLinkUsedUseCase {
  constructor(
    @inject('ILinkRepository') private linkRepository: ILinkRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Mark link used data transfer object
   * @returns Result containing link response or error
   */
  async execute(dto: MarkLinkUsedDto): Promise<Result<LinkResponseDto, AppError>> {
    try {
      logger.info('Marking link as used', { linkId: dto.linkId });

      // Find link by linkId
      const link = await this.linkRepository.findByLinkId(dto.linkId);
      if (!link) {
        logger.warn('Link not found', { linkId: dto.linkId });
        return failure(new LinkNotFoundError(dto.linkId));
      }

      // Mark link as used
      const markResult = link.markAsUsed();
      if (markResult.isFailure) {
        logger.error('Failed to mark link as used', {
          linkId: dto.linkId,
          error: markResult.error,
        });
        return failure(
          new BusinessRuleViolationError(
            markResult.error.message,
            { details: markResult.error }
          )
        );
      }

      // Update link in database (only if it's a one-time link)
      let updatedLink = link;
      if (link.oneTimeLink) {
        updatedLink = await this.linkRepository.update(link);
        logger.info('One-time link marked as used', {
          linkId: dto.linkId,
        });
      } else {
        logger.info('Link is not one-time, no update needed', {
          linkId: dto.linkId,
        });
      }

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
      logger.error('Error marking link as used', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to mark link as used: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
