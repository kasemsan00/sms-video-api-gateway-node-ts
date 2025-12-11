/**
 * MySQL Link Repository Implementation
 */

import { injectable } from 'tsyringe';
import { RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from '../base-repository.js';
import { Link } from '@domain/entities/link.entity.js';
import { ILinkRepository } from '@domain/repositories/link.repository.interface.js';
import { LinkType } from '@shared/constants/link-types.constant.js';
import { UserType } from '@shared/constants/user-types.constant.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError, DatabaseError, LinkNotFoundError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/error-codes.constant.js';

@injectable()
export class MySqlLinkRepository extends BaseRepository<Link> implements ILinkRepository {
  constructor() {
    super('link_connect');
  }

  /**
   * Map database row to Link entity
   */
  protected mapToDomain(row: RowDataPacket): Result<Link, AppError> {
    try {
      const link = Link.fromPersistence({
        linkId: row.linkID,
        room: row.room,
        mobile: row.mobile,
        userType: row.userType as UserType,
        linkType: row.linkType as LinkType,
        userName: row.userName,
        isAdmin: row.isAdmin === '1' || row.isAdmin === 1,
        requireJoinPermission: row.requireJoinPermission === 1,
        requireUserName: row.requireUserName === 1,
        password: row.password,
        oneTimeLink: row.oneTimeLink === 1,
        isUsed: row.isUsed === 1,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy,
        createdAt: new Date(row.dtmCreated),
        updatedAt: new Date(row.dtmUpdated ?? row.dtmCreated),
        expiresAt: row.dtmExpired ? new Date(row.dtmExpired) : undefined,
      });

      return success(link);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(
        new DatabaseError(
          `Failed to map link from database: ${message}`,
          { row, originalError: message }
        )
      );
    }
  }

  /**
   * Map Link entity to database row
   */
  protected mapToDatabase(link: Link): Record<string, unknown> {
    const persistence = link.toPersistence();
    return {
      linkID: persistence.linkId,
      room: persistence.room,
      mobile: persistence.mobile,
      userType: persistence.userType,
      linkType: persistence.linkType,
      userName: persistence.userName,
      isAdmin: persistence.isAdmin,
      requireJoinPermission: persistence.requireJoinPermission,
      requireUserName: persistence.requireUserName,
      password: persistence.password,
      oneTimeLink: persistence.oneTimeLink,
      isUsed: persistence.isUsed,
      latitude: persistence.latitude,
      longitude: persistence.longitude,
      accuracy: persistence.accuracy,
      dtmCreated: persistence.dtmCreated,
      dtmUpdated: persistence.dtmUpdated,
      dtmExpired: persistence.dtmExpired,
    };
  }

  /**
   * Find link by linkId
   */
  async findByLinkId(linkId: string): Promise<Link | null> {
    const result = await this.findBy({ linkID: linkId });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value.length > 0 ? (result.value[0] ?? null) : null;
  }

  /**
   * Find links by room
   */
  async findByRoom(room: string): Promise<Link[]> {
    const result = await this.findBy({ room });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find links by room and type
   */
  async findByRoomAndType(room: string, linkType: LinkType): Promise<Link[]> {
    const result = await this.findBy({ room, linkType });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find links by mobile
   */
  async findByMobile(mobile: string): Promise<Link[]> {
    const result = await this.findBy({ mobile });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find expired links
   */
  async findExpired(): Promise<Link[]> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb
      .select()
      .from(this.tableName)
      .where([
        { field: 'dtmExpired', operator: '<', value: new Date() },
        { field: 'dtmExpired', operator: 'IS NOT NULL' },
      ])
      .build();

    const result = await this.executeQuery<RowDataPacket[]>(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const links: Link[] = [];
    for (const row of result.value) {
      const linkResult = this.mapToDomain(row);
      if (linkResult.isFailure) {
        throw linkResult.error;
      }
      links.push(linkResult.value);
    }

    return links;
  }

  /**
   * Check if link exists
   */
  async exists(linkId: string): Promise<boolean> {
    const result = await super.exists({ linkID: linkId });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Create a new link
   */
  async create(link: Link): Promise<Link> {
    const data = this.mapToDatabase(link);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.insert(this.tableName, data);

    const result = await this.executeInsert(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    // Fetch the created link
    const createdLink = await this.findByLinkId(link.linkId);
    if (!createdLink) {
      throw new DatabaseError('Failed to fetch created link');
    }

    return createdLink;
  }

  /**
   * Update a link
   */
  async update(link: Link): Promise<Link> {
    const data = this.mapToDatabase(link);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(this.tableName, data, { linkID: link.linkId });

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new LinkNotFoundError(link.linkId);
    }

    // Fetch the updated link
    const updatedLink = await this.findByLinkId(link.linkId);
    if (!updatedLink) {
      throw new DatabaseError('Failed to fetch updated link');
    }

    return updatedLink;
  }

  /**
   * Delete a link
   */
  async delete(linkId: string): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.delete(this.tableName, { linkID: linkId });

    const result = await this.executeDelete(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new LinkNotFoundError(linkId);
    }
  }

  /**
   * Delete all links in a room
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
   * Update link location
   */
  async updateLocation(
    linkId: string,
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Promise<void> {
    const qb = this.createQueryBuilder();
    const updateData: Record<string, unknown> = {
      latitude,
      longitude,
      dtmUpdated: new Date(),
    };

    if (accuracy !== undefined) {
      updateData.accuracy = accuracy;
    }

    const { sql, params } = qb.update(this.tableName, updateData, { linkID: linkId });

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new LinkNotFoundError(linkId);
    }
  }

  /**
   * Mark link as used
   */
  async markAsUsed(linkId: string): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { isUsed: 1, dtmUpdated: new Date() },
      { linkID: linkId }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new LinkNotFoundError(linkId);
    }
  }

  /**
   * Count links by room
   */
  async countByRoom(room: string): Promise<number> {
    const result = await this.countBy({ room });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}
