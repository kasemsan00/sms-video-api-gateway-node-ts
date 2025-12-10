/**
 * Verify Token Use Case
 * Verifies and decodes a JWT authentication token
 */

import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { VerifyTokenDto, VerifyTokenResponseDto, TokenPayload } from '@application/dtos/index.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, InvalidTokenError, TokenExpiredError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for verifying JWT tokens
 * Validates token signature and expiration
 */
@injectable()
export class VerifyTokenUseCase {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
  }

  /**
   * Execute the use case
   * @param dto Verify token data transfer object
   * @returns Result containing verification response or error
   */
  async execute(dto: VerifyTokenDto): Promise<Result<VerifyTokenResponseDto, AppError>> {
    try {
      logger.info('Verifying JWT token');

      // Verify and decode token
      const decoded = jwt.verify(dto.token, this.jwtSecret) as TokenPayload;

      logger.info('JWT token verified successfully', {
        identity: decoded.identity,
        room: decoded.room,
      });

      // Map to response DTO
      const response: VerifyTokenResponseDto = {
        valid: true,
        payload: decoded,
      };

      return success(response);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('JWT token has expired', { expiredAt: error.expiredAt });
        return failure(new TokenExpiredError());
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid JWT token', { error: error.message });
        return failure(new InvalidTokenError(error.message));
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error verifying token', { error: message });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to verify token: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
