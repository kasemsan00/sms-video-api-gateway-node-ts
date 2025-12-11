/**
 * Refresh Token Use Case
 * Refreshes an existing JWT token with extended expiry
 */

import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { RefreshTokenDto, CreateTokenResponseDto, TokenPayload } from '@application/dtos/index.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, InvalidTokenError, TokenExpiredError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for refreshing JWT tokens
 * Validates old token and creates new token with extended expiry
 */
@injectable()
export class RefreshTokenUseCase {
  private readonly jwtSecret: string;
  private readonly refreshWindow: number = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
  }

  /**
   * Execute the use case
   * @param dto Refresh token data transfer object
   * @returns Result containing new token response or error
   */
  async execute(dto: RefreshTokenDto): Promise<Result<CreateTokenResponseDto, AppError>> {
    try {
      logger.info('Refreshing JWT token');

      // Verify old token (allow expired tokens within refresh window)
      let decoded: TokenPayload;

      try {
        decoded = jwt.verify(dto.token, this.jwtSecret) as TokenPayload;
      } catch (error) {
        // If token is expired, check if it's within refresh window
        if (error instanceof jwt.TokenExpiredError) {
          const decodedExpired = jwt.decode(dto.token) as TokenPayload;

          if (!decodedExpired) {
            logger.warn('Token cannot be decoded');
            return failure(new InvalidTokenError('Token cannot be decoded'));
          }

          const now = Math.floor(Date.now() / 1000);
          const expiredAt = decodedExpired.exp;
          const timeSinceExpiry = now - expiredAt;

          // Check if token expired within refresh window
          if (timeSinceExpiry > this.refreshWindow) {
            logger.warn('Token expired beyond refresh window', {
              expiredAt: new Date(expiredAt * 1000),
              timeSinceExpiry,
            });
            return failure(
              new TokenExpiredError(new Date(expiredAt * 1000))
            );
          }

          decoded = decodedExpired;
        } else {
          logger.warn('Invalid token for refresh', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return failure(new InvalidTokenError('Invalid token'));
        }
      }

      // Create new token with same payload but extended expiry
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = '24h'; // Default to 24 hours
      const exp = now + 24 * 60 * 60; // 24 hours in seconds

      const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
        identity: decoded.identity,
        room: decoded.room,
        name: decoded.name,
        isAdmin: decoded.isAdmin,
      };

      // Sign new token
      const newToken = jwt.sign(payload, this.jwtSecret, {
        expiresIn,
      });

      // Decode to get full payload with iat and exp
      const newDecoded = jwt.decode(newToken) as TokenPayload;

      logger.info('JWT token refreshed successfully', {
        identity: decoded.identity,
        newExpiresAt: new Date(exp * 1000),
      });

      // Map to response DTO
      const response: CreateTokenResponseDto = {
        token: newToken,
        expiresAt: new Date(exp * 1000),
        payload: newDecoded,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error refreshing token', { error: message });

      return failure(
        new InternalServerError(
          `Failed to refresh token: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
