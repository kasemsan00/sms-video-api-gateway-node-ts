/**
 * Auth Application Service
 * Orchestrates authentication-related use cases
 */

import { injectable } from 'tsyringe';
import {
  CreateTokenUseCase,
  VerifyTokenUseCase,
  RefreshTokenUseCase,
} from '../use-cases/auth/index.js';
import {
  CreateTokenDto,
  VerifyTokenDto,
  RefreshTokenDto,
  CreateTokenResponseDto,
  VerifyTokenResponseDto,
} from '../dtos/index.js';
import { Result } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';

/**
 * Auth Service
 * High-level service for authentication operations
 */
@injectable()
export class AuthService {
  constructor(
    private createTokenUseCase: CreateTokenUseCase,
    private verifyTokenUseCase: VerifyTokenUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase
  ) {}

  /**
   * Create JWT authentication token
   */
  async createToken(dto: CreateTokenDto): Promise<Result<CreateTokenResponseDto, AppError>> {
    return this.createTokenUseCase.execute(dto);
  }

  /**
   * Verify JWT authentication token
   */
  async verifyToken(dto: VerifyTokenDto): Promise<Result<VerifyTokenResponseDto, AppError>> {
    return this.verifyTokenUseCase.execute(dto);
  }

  /**
   * Refresh JWT authentication token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<Result<CreateTokenResponseDto, AppError>> {
    return this.refreshTokenUseCase.execute(dto);
  }
}
