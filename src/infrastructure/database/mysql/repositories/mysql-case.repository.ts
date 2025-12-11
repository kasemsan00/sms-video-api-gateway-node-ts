/**
 * MySQL Case Repository Implementation
 */

import { injectable } from 'tsyringe';
import { RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from '../base-repository.js';
import { Case } from '@domain/entities/case.entity.js';
import { ICaseRepository } from '@domain/repositories/case.repository.interface.js';
import { PaginatedResult, PaginationParams } from '@shared/types/pagination.type.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError, DatabaseError, CaseNotFoundError } from '@shared/errors/index.js';

@injectable()
export class MySqlCaseRepository extends BaseRepository<Case> implements ICaseRepository {
  constructor() {
    super('case_data');
  }

  /**
   * Map database row to Case entity
   */
  protected mapToDomain(row: RowDataPacket): Result<Case, AppError> {
    try {
      const caseEntity = Case.fromPersistence({
        id: row.id,
        room: row.room,
        caseNumber: row.caseNumber,
        description: row.description,
        status: row.status,
        priority: row.priority,
        assignedTo: row.assignedTo,
        createdAt: new Date(row.dtmCreated),
        updatedAt: row.dtmUpdated ? new Date(row.dtmUpdated) : new Date(row.dtmCreated),
      });

      return success(caseEntity);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(
        new DatabaseError(
          `Failed to map case from database: ${message}`,
          { row, originalError: message }
        )
      );
    }
  }

  /**
   * Map Case entity to database row
   */
  protected mapToDatabase(caseEntity: Case): Record<string, unknown> {
    const persistence = caseEntity.toPersistence();
    return {
      id: persistence.id,
      room: persistence.room,
      caseNumber: persistence.caseNumber,
      description: persistence.description,
      status: persistence.status,
      priority: persistence.priority,
      assignedTo: persistence.assignedTo,
      dtmCreated: persistence.dtmCreated,
      dtmUpdated: persistence.dtmUpdated,
    };
  }

  /**
   * Find case by ID
   */
  async findById(id: number): Promise<Case | null> {
    const result = await this.findOneById(id);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find cases by room
   */
  async findByRoom(room: string): Promise<Case[]> {
    const result = await this.findBy({ room });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find case by case number
   */
  async findByCaseNumber(caseNumber: string): Promise<Case | null> {
    const result = await this.findBy({ caseNumber });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value.length > 0 ? (result.value[0] ?? null) : null;
  }

  /**
   * Find cases by status
   */
  async findByStatus(status: string): Promise<Case[]> {
    const result = await this.findBy({ status });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find all cases with pagination
   */
  async findAll(params: PaginationParams): Promise<PaginatedResult<Case>> {
    const result = await this.findAllPaginated(params);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Create a new case
   */
  async create(caseEntity: Case): Promise<Case> {
    const data = this.mapToDatabase(caseEntity);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.insert(this.tableName, data);

    const result = await this.executeInsert(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const insertId = result.value;

    // Fetch the created case
    const createdCase = await this.findById(insertId);
    if (!createdCase) {
      throw new DatabaseError('Failed to fetch created case');
    }

    return createdCase;
  }

  /**
   * Update a case
   */
  async update(caseEntity: Case): Promise<Case> {
    const data = this.mapToDatabase(caseEntity);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(this.tableName, data, { id: caseEntity.id });

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new CaseNotFoundError(caseEntity.id);
    }

    // Fetch the updated case
    const updatedCase = await this.findById(caseEntity.id);
    if (!updatedCase) {
      throw new DatabaseError('Failed to fetch updated case');
    }

    return updatedCase;
  }

  /**
   * Delete a case
   */
  async delete(id: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.delete(this.tableName, { id });

    const result = await this.executeDelete(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new CaseNotFoundError(id);
    }
  }

  /**
   * Update case status
   */
  async updateStatus(id: number, status: string): Promise<void> {
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
      throw new CaseNotFoundError(id);
    }
  }

  /**
   * Count cases by room
   */
  async countByRoom(room: string): Promise<number> {
    const result = await this.countBy({ room });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Count cases by status
   */
  async countByStatus(status: string): Promise<number> {
    const result = await this.countBy({ status });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}
