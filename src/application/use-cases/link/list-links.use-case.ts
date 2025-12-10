/**
 * List Links Use Case
 * Retrieves all links for a room, optionally filtered by link type
 */

import { injectable, inject } from 'tsyringe';
import { ListLinksDto, LinkResponseDto } from '@application/dtos/index.js';
import { ILinkRepository } from '@domain/repositories/link.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for listing links in a room
 * Queries repository by room name with optional link type filter
 */
@injectable()
export class ListLinksUseCase {
  constructor(
    @inject('ILinkRepository') private linkRepository: ILinkRepository
  ) {}

  /**
   * Execute the use case
   * @param dto List links data transfer object
   * @returns Result containing array of link responses or error
   */
  async execute(dto: ListLinksDto): Promise<Result<LinkResponseDto[], AppError>> {
    try {
      logger.info('Listing links for room', {
        room: dto.room,
        linkType: dto.linkType,
      });

      // Query links by room
      let links = await this.linkRepository.findByRoom(dto.room);

      // Filter by link type if specified
      if (dto.linkType) {
        links = links.filter((link) => link.linkType === dto.linkType);
      }

      logger.info('Links listed successfully', {
        room: dto.room,
        totalLinks: links.length,
        linkType: dto.linkType,
      });

      // Build base URL for links
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';

      // Map to response DTOs
      const response: LinkResponseDto[] = links.map((link) => ({
        linkId: link.linkId,
        room: link.room,
        mobile: link.mobile,
        userType: link.userType,
        linkType: link.linkType,
        userName: link.userName,
        isAdmin: link.isAdmin,
        requireJoinPermission: link.requireJoinPermission,
        requireUserName: link.requireUserName,
        oneTimeLink: link.oneTimeLink,
        isUsed: link.isUsed,
        latitude: link.latitude,
        longitude: link.longitude,
        accuracy: link.accuracy,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
        expiresAt: link.expiresAt,
        url: `${baseUrl}/join/${link.linkId}`,
      }));

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error listing links', { error: message, dto });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to list links: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
