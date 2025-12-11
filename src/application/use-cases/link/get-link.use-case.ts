/**
 * Get Link Use Case
 * Retrieves link details by linkId
 */

import { injectable, inject } from "tsyringe";
import { GetLinkDto, LinkResponseDto } from "@application/dtos/index.js";
import { ILinkRepository } from "@domain/repositories/link.repository.interface.js";
import { Result, success, failure } from "@shared/types/index.js";
import { AppError, LinkNotFoundError, LinkExpiredError, InternalServerError } from "@shared/errors/index.js";
import { logger } from "@shared/utils/index.js";

/**
 * Use case for retrieving link details
 * Finds and returns link information by linkId
 */
@injectable()
export class GetLinkUseCase {
  constructor(@inject("ILinkRepository") private linkRepository: ILinkRepository) {}

  /**
   * Execute the use case
   * @param dto Get link data transfer object
   * @returns Result containing link response or error
   */
  async execute(dto: GetLinkDto): Promise<Result<LinkResponseDto, AppError>> {
    try {
      logger.info("Getting link details", { linkId: dto.linkId });

      // Find link by linkId
      const link = await this.linkRepository.findByLinkId(dto.linkId);
      if (!link) {
        logger.warn("Link not found", { linkId: dto.linkId });
        return failure(new LinkNotFoundError(dto.linkId));
      }

      // Check if link is expired
      if (link.isExpired()) {
        logger.warn("Link has expired", {
          linkId: dto.linkId,
          expiresAt: link.expiresAt,
        });
        return failure(new LinkExpiredError(dto.linkId, link.expiresAt ?? new Date()));
      }

      logger.info("Link found", { linkId: link.linkId, room: link.room });

      // Build full URL
      const baseUrl = process.env.APP_URL || "http://localhost:3000";
      const url = `${baseUrl}/join/${link.linkId}`;

      // Map to response DTO
      const response: LinkResponseDto = {
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
        url,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Error getting link", { error: message, dto });

      return failure(new InternalServerError(`Failed to get link: ${message}`, { originalError: message }));
    }
  }
}
