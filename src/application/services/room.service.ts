/**
 * Room Application Service
 * Orchestrates room-related use cases
 */

import { injectable } from 'tsyringe';
import {
  CreateRoomUseCase,
  CloseRoomUseCase,
  ReopenRoomUseCase,
  GetRoomUseCase,
  ListRoomsUseCase,
  ExtendRoomExpiryUseCase,
} from '../use-cases/room/index.js';
import {
  CreateRoomDto,
  CloseRoomDto,
  ReopenRoomDto,
  GetRoomDto,
  ListRoomsDto,
  ExtendRoomExpiryDto,
  RoomResponseDto,
  ListRoomsResponseDto,
} from '../dtos/index.js';
import { Result } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';

/**
 * Room Service
 * High-level service for room operations
 */
@injectable()
export class RoomService {
  constructor(
    private createRoomUseCase: CreateRoomUseCase,
    private closeRoomUseCase: CloseRoomUseCase,
    private reopenRoomUseCase: ReopenRoomUseCase,
    private getRoomUseCase: GetRoomUseCase,
    private listRoomsUseCase: ListRoomsUseCase,
    private extendRoomExpiryUseCase: ExtendRoomExpiryUseCase
  ) {}

  /**
   * Create a new room
   */
  async createRoom(dto: CreateRoomDto): Promise<Result<RoomResponseDto, AppError>> {
    return this.createRoomUseCase.execute(dto);
  }

  /**
   * Close a room
   */
  async closeRoom(dto: CloseRoomDto): Promise<Result<void, AppError>> {
    return this.closeRoomUseCase.execute(dto);
  }

  /**
   * Reopen a room
   */
  async reopenRoom(dto: ReopenRoomDto): Promise<Result<RoomResponseDto, AppError>> {
    return this.reopenRoomUseCase.execute(dto);
  }

  /**
   * Get room details
   */
  async getRoom(dto: GetRoomDto): Promise<Result<RoomResponseDto, AppError>> {
    return this.getRoomUseCase.execute(dto);
  }

  /**
   * List rooms
   */
  async listRooms(dto: ListRoomsDto): Promise<Result<ListRoomsResponseDto, AppError>> {
    return this.listRoomsUseCase.execute(dto);
  }

  /**
   * Extend room expiry
   */
  async extendRoomExpiry(dto: ExtendRoomExpiryDto): Promise<Result<RoomResponseDto, AppError>> {
    return this.extendRoomExpiryUseCase.execute(dto);
  }
}
