/**
 * Create Token Use Case
 * Creates a JWT authentication token for user authorization
 */

import { injectable } from 'tsyringe';
import jwt from 'jsonwebtoken';
import { CreateTokenDto, CreateTokenResponseDto, TokenPayload } from '@application/dtos/index.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for creating JWT tokens
 * Generates signed JWT with user claims
 */
@injectable()
export class CreateTokenUseCase {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

    if (this.jwtSecret === 'default-secret-key-change-in-production') {
      logger.warn('Using default JWT secret - please set JWT_SECRET environment variable');
    }
  }

  /**
   * Execute the use case
   * @param dto Create token data transfer object
   * @returns Result containing token response or error
   */
  async execute(dto: CreateTokenDto): Promise<Result<CreateTokenResponseDto, AppError>> {
    try {
      logger.info('Creating JWT token', {
        identity: dto.identity,
        room: dto.room,
      });

      // Calculate expiration time
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = this.parseExpiresIn(dto.expiresIn ?? '24h');
      const exp = now + expiresIn;

      // Create token payload
      const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
        identity: dto.identity,
        room: dto.room,
        name: dto.name,
        isAdmin: dto.isAdmin,
      };

      // Sign the token - convert seconds to string format for jwt.sign
      const token = jwt.sign(payload, this.jwtSecret, {
        expiresIn: expiresIn, // jwt.sign accepts number (seconds) or string
      });

      // Decode to get full payload with iat and exp
      const decoded = jwt.decode(token) as TokenPayload;

      logger.info('JWT token created successfully', {
        identity: dto.identity,
        expiresAt: new Date(exp * 1000),
      });

      // Map to response DTO
      const response: CreateTokenResponseDto = {
        token,
        expiresAt: new Date(exp * 1000),
        payload: decoded,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating token', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to create token: ${message}`,
          { originalError: message }
        )
      );
    }
  }

  /**
   * Parse expires-in string to seconds
   * Supports formats like: '1h', '24h', '7d', '30s'
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 24 hours if invalid format
      return 24 * 60 * 60;
    }

    const value = parseInt(match[1] ?? '0', 10);
    const unit = match[2] ?? 'h';

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 24 * 60 * 60;
    }
  }
}
