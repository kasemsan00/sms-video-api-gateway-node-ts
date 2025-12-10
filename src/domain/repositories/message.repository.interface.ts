/**
 * Message Repository Interface
 * Defines the contract for message data persistence
 */

import { Message } from '../entities/message.entity.js';
import { PaginatedResult, PaginationParams } from '@shared/types/index.js';

export interface IMessageRepository {
  // Read operations
  findById(id: number): Promise<Message | null>;
  findByRoom(
    room: string,
    params: PaginationParams
  ): Promise<PaginatedResult<Message>>;
  findRecentByRoom(room: string, limit: number): Promise<Message[]>;
  findByIdentity(identity: string): Promise<Message[]>;

  // Write operations
  create(message: Message): Promise<Message>;
  update(message: Message): Promise<Message>;
  delete(id: number): Promise<void>;
  deleteByRoom(room: string): Promise<void>;

  // Specific operations
  softDelete(id: number): Promise<void>;
  countByRoom(room: string): Promise<number>;
  countUnreadByRoom(room: string): Promise<number>;
}
