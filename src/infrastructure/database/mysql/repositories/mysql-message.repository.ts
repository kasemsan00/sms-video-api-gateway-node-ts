/**
 * MySQL Message Repository Implementation
 */

import { injectable } from 'tsyringe';
import { RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from '../base-repository.js';
import { Message } from '@domain/entities/message.entity.js';
import { IMessageRepository } from '@domain/repositories/message.repository.interface.js';
import { PaginatedResult, PaginationParams } from '@shared/types/pagination.type.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError, DatabaseError, MessageNotFoundError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/error-codes.constant.js';

@injectable()
export class MySqlMessageRepository extends BaseRepository<Message> implements IMessageRepository {
  constructor() {
    super('chat_message');
  }

  /**
   * Map database row to Message entity
   */
  protected mapToDomain(row: RowDataPacket): Result<Message, AppError> {
    try {
      const message = Message.fromPersistence({
        id: row.id,
        room: row.room,
        identity: row.identity,
        name: row.userName,
        message: row.text,
        isDeleted: row.isDeleted === 1,
        createdAt: new Date(row.dtmCreated),
        updatedAt: row.dtmUpdated ? new Date(row.dtmUpdated) : new Date(row.dtmCreated),
      });

      return success(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(
        new DatabaseError(
          `Failed to map message from database: ${message}`,
          { row, originalError: message }
        )
      );
    }
  }

  /**
   * Map Message entity to database row
   */
  protected mapToDatabase(message: Message): Record<string, unknown> {
    const persistence = message.toPersistence();
    return {
      id: persistence.id,
      room: persistence.room,
      identity: persistence.identity,
      userName: persistence.name,
      text: persistence.message,
      isDeleted: persistence.isDeleted,
      dtmCreated: persistence.dtmCreated,
      dtmUpdated: persistence.dtmUpdated,
    };
  }

  /**
   * Find message by ID
   */
  async findById(id: number): Promise<Message | null> {
    const result = await this.findOneById(id);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find messages by room with pagination
   */
  async findByRoom(
    room: string,
    params: PaginationParams
  ): Promise<PaginatedResult<Message>> {
    const result = await this.findAllPaginated(params, { room, isDeleted: 0 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find recent messages by room
   */
  async findRecentByRoom(room: string, limit: number): Promise<Message[]> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb
      .select()
      .from(this.tableName)
      .where([
        { field: 'room', operator: '=', value: room },
        { field: 'isDeleted', operator: '=', value: 0 },
      ])
      .orderBy('dtmCreated', 'DESC')
      .limit(limit)
      .build();

    const result = await this.executeQuery<RowDataPacket[]>(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const messages: Message[] = [];
    for (const row of result.value) {
      const messageResult = this.mapToDomain(row);
      if (messageResult.isFailure) {
        throw messageResult.error;
      }
      messages.push(messageResult.value);
    }

    return messages;
  }

  /**
   * Find messages by identity
   */
  async findByIdentity(identity: string): Promise<Message[]> {
    const result = await this.findBy({ identity, isDeleted: 0 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Create a new message
   */
  async create(message: Message): Promise<Message> {
    const data = this.mapToDatabase(message);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.insert(this.tableName, data);

    const result = await this.executeInsert(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const insertId = result.value;

    // Fetch the created message
    const createdMessage = await this.findById(insertId);
    if (!createdMessage) {
      throw new DatabaseError('Failed to fetch created message');
    }

    return createdMessage;
  }

  /**
   * Update a message
   */
  async update(message: Message): Promise<Message> {
    const data = this.mapToDatabase(message);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(this.tableName, data, { id: message.id });

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new MessageNotFoundError(message.id);
    }

    // Fetch the updated message
    const updatedMessage = await this.findById(message.id);
    if (!updatedMessage) {
      throw new DatabaseError('Failed to fetch updated message');
    }

    return updatedMessage;
  }

  /**
   * Delete a message (hard delete)
   */
  async delete(id: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.delete(this.tableName, { id });

    const result = await this.executeDelete(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new MessageNotFoundError(id);
    }
  }

  /**
   * Delete all messages in a room
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
   * Soft delete a message
   */
  async softDelete(id: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { isDeleted: 1, dtmUpdated: new Date() },
      { id }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new MessageNotFoundError(id);
    }
  }

  /**
   * Count messages by room
   */
  async countByRoom(room: string): Promise<number> {
    const result = await this.countBy({ room, isDeleted: 0 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Count unread messages by room
   */
  async countUnreadByRoom(room: string): Promise<number> {
    // Since there's no explicit unread field in the schema,
    // we'll count all non-deleted messages
    // This might need to be adjusted based on actual requirements
    const result = await this.countBy({ room, isDeleted: 0 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}
