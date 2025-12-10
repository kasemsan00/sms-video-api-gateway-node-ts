/**
 * User Repository Interface
 * Defines the contract for user data persistence
 */

import { User } from '../entities/user.entity.js';

export interface IUserRepository {
  // Read operations
  findById(id: number): Promise<User | null>;
  findByIdentity(identity: string): Promise<User | null>;
  findByRoom(room: string): Promise<User[]>;
  findByRoomAndIdentity(room: string, identity: string): Promise<User | null>;
  findAdminsByRoom(room: string): Promise<User[]>;
  findOnlineUsersByRoom(room: string): Promise<User[]>;
  exists(room: string, identity: string): Promise<boolean>;

  // Write operations
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  deleteByRoom(room: string): Promise<void>;

  // Specific operations
  updateOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  updateJoinStatus(id: number, isJoin: boolean): Promise<void>;
  countByRoom(room: string): Promise<number>;
  countOnlineByRoom(room: string): Promise<number>;
}
