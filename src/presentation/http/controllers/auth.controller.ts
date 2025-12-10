/**
 * Auth Controller
 * Handles HTTP requests for authentication operations
 */

import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';
import { AuthService } from '@/application/services/auth.service.js';
import {
  CreateTokenDto,
  VerifyTokenDto,
  RefreshTokenDto,
} from '@/application/dtos/auth.dto.js';

@injectable()
export class AuthController extends BaseController {
  constructor(
    @inject('AuthService') private readonly authService: AuthService
  ) {
    super();
  }

  /**
   * Create JWT token
   * POST /api/auth/token
   */
  createToken = async (req: Request, res: Response): Promise<void> => {
    const dto: CreateTokenDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.authService.createToken(dto),
      201
    );
  };

  /**
   * Verify JWT token
   * POST /api/auth/verify
   */
  verifyToken = async (req: Request, res: Response): Promise<void> => {
    const dto: VerifyTokenDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.authService.verifyToken(dto)
    );
  };

  /**
   * Refresh JWT token
   * POST /api/auth/refresh
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const dto: RefreshTokenDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.authService.refreshToken(dto)
    );
  };
}
