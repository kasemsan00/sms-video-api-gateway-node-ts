/**
 * MySQL User Repository Implementation
 */

import { injectable } from 'tsyringe';
import { RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from '../base-repository.js';
import { User } from '@domain/entities/user.entity.js';
import { IUserRepository } from '@domain/repositories/user.repository.interface.js';
import { UserType } from '@shared/constants/user-types.constant.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError, DatabaseError, UserNotFoundError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/error-codes.constant.js';

@injectable()
export class MySqlUserRepository extends BaseRepository<User> implements IUserRepository {
  constructor() {
    super('room_user');
  }

  /**
   * Map database row to User entity
   */
  protected mapToDomain(row: RowDataPacket): Result<User, AppError> {
    try {
      const user = User.fromPersistence({
        id: row.id,
        room: row.room,
        identity: row.identity,
        name: row.userName,
        userType: row.userType as UserType,
        mobile: row.mobile,
        metadata: row.metadata,
        color: row.color,
        isAdmin: row.isAdmin === 1,
        isJoin: row.isJoin === 1,
        isOnline: row.isOnline === 1,
        isSpeaker: row.isSpeaker === 1,
        isShareScreen: row.isShareScreen === 1,
        isShareVideo: row.isShareVideo === 1,
        isShareAudio: row.isShareAudio === 1,
        isMobile: row.isMobile === 1,
        createdAt: new Date(row.dtmcreated),
        updatedAt: new Date(row.dtmupdated),
      });

      return success(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(
        new DatabaseError(
          `Failed to map user from database: ${message}`,
          { row, originalError: message }
        )
      );
    }
  }

  /**
   * Map User entity to database row
   */
  protected mapToDatabase(user: User): Record<string, unknown> {
    const persistence = user.toPersistence();
    return {
      id: persistence.id,
      room: persistence.room,
      identity: persistence.identity,
      userName: persistence.name,
      userType: persistence.userType,
      mobile: persistence.mobile,
      metadata: persistence.metadata,
      color: persistence.color,
      isAdmin: persistence.isAdmin,
      isJoin: persistence.isJoin,
      isOnline: persistence.isOnline,
      isSpeaker: persistence.isSpeaker,
      isShareScreen: persistence.isShareScreen,
      isShareVideo: persistence.isShareVideo,
      isShareAudio: persistence.isShareAudio,
      isMobile: persistence.isMobile,
      dtmcreated: persistence.createdAt,
      dtmupdated: persistence.updatedAt,
    };
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const result = await this.findOneById(id);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find user by identity
   */
  async findByIdentity(identity: string): Promise<User | null> {
    const result = await this.findBy({ identity });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value.length > 0 ? result.value[0] : null;
  }

  /**
   * Find users by room
   */
  async findByRoom(room: string): Promise<User[]> {
    const result = await this.findBy({ room });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find user by room and identity
   */
  async findByRoomAndIdentity(room: string, identity: string): Promise<User | null> {
    const result = await this.findBy({ room, identity });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value.length > 0 ? result.value[0] : null;
  }

  /**
   * Find admin users by room
   */
  async findAdminsByRoom(room: string): Promise<User[]> {
    const result = await this.findBy({ room, isAdmin: 1 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find online users by room
   */
  async findOnlineUsersByRoom(room: string): Promise<User[]> {
    const result = await this.findBy({ room, isOnline: 1 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Check if user exists by room and identity
   */
  async exists(room: string, identity: string): Promise<boolean> {
    const result = await super.exists({ room, identity });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Create a new user
   */
  async create(user: User): Promise<User> {
    const data = this.mapToDatabase(user);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.insert(this.tableName, data);

    const result = await this.executeInsert(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const insertId = result.value;

    // Fetch the created user
    const createdUser = await this.findById(insertId);
    if (!createdUser) {
      throw new DatabaseError('Failed to fetch created user');
    }

    return createdUser;
  }

  /**
   * Update a user
   */
  async update(user: User): Promise<User> {
    const data = this.mapToDatabase(user);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(this.tableName, data, { id: user.id });

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new UserNotFoundError(user.id.toString());
    }

    // Fetch the updated user
    const updatedUser = await this.findById(user.id);
    if (!updatedUser) {
      throw new DatabaseError('Failed to fetch updated user');
    }

    return updatedUser;
  }

  /**
   * Delete a user
   */
  async delete(id: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.delete(this.tableName, { id });

    const result = await this.executeDelete(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new UserNotFoundError(id.toString());
    }
  }

  /**
   * Delete all users in a room
   */
  async deleteByRoom(room: string): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.delete(this.tableName, { room });

    const result = await this.executeDelete(sql, params);

    if (result.isFailure) {
      throw result.error;
    }
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { isOnline: isOnline ? 1 : 0, dtmupdated: new Date() },
      { id }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new UserNotFoundError(id.toString());
    }
  }

  /**
   * Update user join status
   */
  async updateJoinStatus(id: number, isJoin: boolean): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { isJoin: isJoin ? 1 : 0, dtmupdated: new Date() },
      { id }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new UserNotFoundError(id.toString());
    }
  }

  /**
   * Count users by room
   */
  async countByRoom(room: string): Promise<number> {
    const result = await this.countBy({ room });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Count online users by room
   */
  async countOnlineByRoom(room: string): Promise<number> {
    const result = await this.countBy({ room, isOnline: 1 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}
