/**
 * User Application Service
 * Orchestrates user-related use cases
 */

import { injectable } from 'tsyringe';
import {
  GenerateTokenUseCase,
  JoinRoomUseCase,
  LeaveRoomUseCase,
  GetUserUseCase,
  ListUsersUseCase,
} from '../use-cases/user/index.js';
import {
  GenerateTokenDto,
  JoinRoomDto,
  LeaveRoomDto,
  GetUserDto,
  ListUsersDto,
  GenerateTokenResponseDto,
  UserResponseDto,
} from '../dtos/index.js';
import { Result } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';

/**
 * User Service
 * High-level service for user operations
 */
@injectable()
export class UserService {
  constructor(
    private generateTokenUseCase: GenerateTokenUseCase,
    private joinRoomUseCase: JoinRoomUseCase,
    private leaveRoomUseCase: LeaveRoomUseCase,
    private getUserUseCase: GetUserUseCase,
    private listUsersUseCase: ListUsersUseCase
  ) {}

  /**
   * Generate LiveKit access token for a user
   */
  async generateToken(dto: GenerateTokenDto): Promise<Result<GenerateTokenResponseDto, AppError>> {
    return this.generateTokenUseCase.execute(dto);
  }

  /**
   * Join a room
   */
  async joinRoom(dto: JoinRoomDto): Promise<Result<UserResponseDto, AppError>> {
    return this.joinRoomUseCase.execute(dto);
  }

  /**
   * Leave a room
   */
  async leaveRoom(dto: LeaveRoomDto): Promise<Result<void, AppError>> {
    return this.leaveRoomUseCase.execute(dto);
  }

  /**
   * Get user details
   */
  async getUser(dto: GetUserDto): Promise<Result<UserResponseDto, AppError>> {
    return this.getUserUseCase.execute(dto);
  }

  /**
   * List users in a room
   */
  async listUsers(dto: ListUsersDto): Promise<Result<UserResponseDto[], AppError>> {
    return this.listUsersUseCase.execute(dto);
  }
}
