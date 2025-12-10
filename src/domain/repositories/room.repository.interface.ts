/**
 * Room Repository Interface
 * Defines the contract for room data persistence
 */

import { Room } from '../entities/room.entity.js';
import { RoomStatus } from '@shared/constants/index.js';
import { PaginatedResult, PaginationParams } from '@shared/types/index.js';

export interface IRoomRepository {
  // Read operations
  findById(id: number): Promise<Room | null>;
  findByName(name: string): Promise<Room | null>;
  findByStatus(status: RoomStatus): Promise<Room[]>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Room>>;
  findExpired(): Promise<Room[]>;
  exists(name: string): Promise<boolean>;

  // Write operations
  create(room: Room): Promise<Room>;
  update(room: Room): Promise<Room>;
  delete(id: number): Promise<void>;

  // Specific operations
  updateStatus(id: number, status: RoomStatus): Promise<void>;
  updateExpiry(id: number, expiryDate: Date): Promise<void>;
  updateMessageUnread(id: number, unread: number): Promise<void>;
  countByStatus(status: RoomStatus): Promise<number>;
}
