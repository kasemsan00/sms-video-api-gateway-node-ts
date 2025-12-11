/**
 * Verify Link Use Case
 * Verifies if a link can be used and password is correct
 */

import { injectable, inject } from 'tsyringe';
import { VerifyLinkDto, LinkResponseDto } from '@application/dtos/index.js';
import { ILinkRepository } from '@domain/repositories/link.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, LinkNotFoundError, BusinessRuleViolationError, InvalidInputError, InvalidCredentialsError, InternalServerError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for verifying link validity
 * Checks expiry, one-time use status, and password if required
 */
@injectable()
export class VerifyLinkUseCase {
  constructor(
    @inject('ILinkRepository') private linkRepository: ILinkRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Verify link data transfer object
   * @returns Result containing link response or error
   */
  async execute(dto: VerifyLinkDto): Promise<Result<LinkResponseDto, AppError>> {
    try {
      logger.info('Verifying link', { linkId: dto.linkId });

      // Find link by linkId
      const link = await this.linkRepository.findByLinkId(dto.linkId);
      if (!link) {
        logger.warn('Link not found', { linkId: dto.linkId });
        return failure(new LinkNotFoundError(dto.linkId));
      }

      // Check if link can be used
      const canUseResult = link.canBeUsed();
      if (canUseResult.isFailure) {
        logger.warn('Link cannot be used', {
          linkId: dto.linkId,
          error: canUseResult.error,
        });
        return failure(
          new BusinessRuleViolationError(
            canUseResult.error.message,
            { details: canUseResult.error }
          )
        );
      }

      // Verify password if required
      if (link.password) {
        if (!dto.password) {
          logger.warn('Password required but not provided', {
            linkId: dto.linkId,
          });
          return failure(
            new InvalidInputError('password', 'Password is required for this link')
          );
        }

        if (!link.verifyPassword(dto.password)) {
          logger.warn('Invalid password provided', {
            linkId: dto.linkId,
          });
          return failure(
            new InvalidCredentialsError('Invalid password')
          );
        }
      }

      logger.info('Link verified successfully', {
        linkId: link.linkId,
        room: link.room,
      });

      // Build full URL
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
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
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error verifying link', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to verify link: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
