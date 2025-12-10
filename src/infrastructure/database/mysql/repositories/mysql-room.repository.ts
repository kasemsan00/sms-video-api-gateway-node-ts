/**
 * MySQL Room Repository Implementation
 */

import { injectable } from 'tsyringe';
import { RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from '../base-repository.js';
import { Room } from '@domain/entities/room.entity.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { RoomStatus } from '@shared/constants/room-status.constant.js';
import { RoomType } from '@shared/constants/room-types.constant.js';
import { PaginatedResult, PaginationParams } from '@shared/types/pagination.type.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError } from '@shared/errors/base.error.js';
import { ErrorCode } from '@shared/constants/error-codes.constant.js';

@injectable()
export class MySqlRoomRepository extends BaseRepository<Room> implements IRoomRepository {
  constructor() {
    super('room_conference');
  }

  /**
   * Map database row to Room entity
   */
  protected mapToDomain(row: RowDataPacket): Result<Room, AppError> {
    try {
      const room = Room.fromPersistence({
        id: row.id,
        name: row.room,
        status: row.status as RoomStatus,
        roomType: row.roomType as RoomType,
        service: row.service,
        autoRecord: row.autoRecord === 1,
        chatEnabled: row.chatEnabled === 1,
        recordId: row.recordId,
        messageUnread: row.messageUnread,
        webSocketURL: row.webSocketURL,
        userAgent: row.userAgent,
        createdAt: new Date(row.dtmCreated),
        updatedAt: new Date(row.dtmUpdated),
        expiresAt: new Date(row.dtmExpired),
      });

      return success(room);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(
        new AppError(
          ErrorCode.DATABASE_ERROR,
          `Failed to map room from database: ${message}`,
          500,
          { row, originalError: message }
        )
      );
    }
  }

  /**
   * Map Room entity to database row
   */
  protected mapToDatabase(room: Room): Record<string, unknown> {
    return room.toPersistence();
  }

  /**
   * Find room by ID
   */
  async findById(id: number): Promise<Room | null> {
    const result = await this.findOneById(id);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find room by name
   */
  async findByName(name: string): Promise<Room | null> {
    const result = await this.findBy({ room: name });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value.length > 0 ? result.value[0] : null;
  }

  /**
   * Find rooms by status
   */
  async findByStatus(status: RoomStatus): Promise<Room[]> {
    const result = await this.findBy({ status });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find all rooms with pagination
   */
  async findAll(params: PaginationParams): Promise<PaginatedResult<Room>> {
    const result = await this.findAllPaginated(params);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find expired rooms
   */
  async findExpired(): Promise<Room[]> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb
      .select()
      .from(this.tableName)
      .where([
        { field: 'dtmExpired', operator: '<', value: new Date() },
        { field: 'status', operator: '=', value: RoomStatus.OPEN },
      ])
      .build();

    const result = await this.executeQuery<RowDataPacket[]>(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const rooms: Room[] = [];
    for (const row of result.value) {
      const roomResult = this.mapToDomain(row);
      if (roomResult.isFailure) {
        throw roomResult.error;
      }
      rooms.push(roomResult.value);
    }

    return rooms;
  }

  /**
   * Check if room exists by name
   */
  async exists(name: string): Promise<boolean> {
    const result = await this.exists({ room: name });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Create a new room
   */
  async create(room: Room): Promise<Room> {
    const data = this.mapToDatabase(room);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.insert(this.tableName, data);

    const result = await this.executeInsert(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const insertId = result.value;

    // Fetch the created room
    const createdRoom = await this.findById(insertId);
    if (!createdRoom) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch created room',
        500
      );
    }

    return createdRoom;
  }

  /**
   * Update a room
   */
  async update(room: Room): Promise<Room> {
    const data = this.mapToDatabase(room);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(this.tableName, data, { id: room.id });

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.ROOM_NOT_FOUND,
        `Room with ID ${room.id} not found`,
        404
      );
    }

    // Fetch the updated room
    const updatedRoom = await this.findById(room.id);
    if (!updatedRoom) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch updated room',
        500
      );
    }

    return updatedRoom;
  }

  /**
   * Delete a room
   */
  async delete(id: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.delete(this.tableName, { id });

    const result = await this.executeDelete(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.ROOM_NOT_FOUND,
        `Room with ID ${id} not found`,
        404
      );
    }
  }

  /**
   * Update room status
   */
  async updateStatus(id: number, status: RoomStatus): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { status, dtmUpdated: new Date() },
      { id }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.ROOM_NOT_FOUND,
        `Room with ID ${id} not found`,
        404
      );
    }
  }

  /**
   * Update room expiry date
   */
  async updateExpiry(id: number, expiryDate: Date): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { dtmExpired: expiryDate, dtmUpdated: new Date() },
      { id }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.ROOM_NOT_FOUND,
        `Room with ID ${id} not found`,
        404
      );
    }
  }

  /**
   * Update message unread count
   */
  async updateMessageUnread(id: number, unread: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { messageUnread: unread, dtmUpdated: new Date() },
      { id }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.ROOM_NOT_FOUND,
        `Room with ID ${id} not found`,
        404
      );
    }
  }

  /**
   * Count rooms by status
   */
  async countByStatus(status: RoomStatus): Promise<number> {
    const result = await this.countBy({ status });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}
