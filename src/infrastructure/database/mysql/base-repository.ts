/**
 * Base Repository
 * Abstract base class for all MySQL repositories
 */

import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { MySqlConnection } from './mysql-connection.js';
import { QueryBuilder } from './query-builder.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError, DatabaseError } from '@shared/errors/index.js';
import { log as logger } from '@shared/utils/index.js';
import { PaginatedResult, PaginationParams, createPaginatedResult } from '@shared/types/pagination.type.js';

/**
 * Base Repository
 * Provides common database operations
 */
export abstract class BaseRepository<T> {
  protected db: MySqlConnection;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = MySqlConnection.getInstance();
    this.tableName = tableName;
  }

  /**
   * Map database row to domain entity
   * Must be implemented by each repository
   */
  protected abstract mapToDomain(row: RowDataPacket): Result<T, AppError>;

  /**
   * Map domain entity to database row
   * Must be implemented by each repository
   */
  protected abstract mapToDatabase(entity: T): Record<string, unknown>;

  /**
   * Create a new query builder instance
   */
  protected createQueryBuilder(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * Execute a raw SQL query and return rows
   */
  protected async executeQuery<R extends RowDataPacket[]>(
    sql: string,
    params?: unknown[]
  ): Promise<Result<R, AppError>> {
    try {
      const result = await this.db.query<R>(sql, params);

      if (result.isFailure) {
        return failure(result.error);
      }

      return success(result.value);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Query execution failed', { error: message, sql });

      return failure(
        new DatabaseError(
          `Query execution failed: ${message}`,
          { sql, originalError: message }
        )
      );
    }
  }

  /**
   * Execute an INSERT query
   */
  protected async executeInsert(
    sql: string,
    params: unknown[]
  ): Promise<Result<number, AppError>> {
    try {
      const result = await this.db.query<ResultSetHeader>(sql, params);

      if (result.isFailure) {
        return failure(result.error);
      }

      return success(result.value.insertId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Insert execution failed', { error: message, sql });

      return failure(
        new DatabaseError(
          `Insert execution failed: ${message}`,
          { sql, originalError: message }
        )
      );
    }
  }

  /**
   * Execute an UPDATE query
   */
  protected async executeUpdate(
    sql: string,
    params: unknown[]
  ): Promise<Result<number, AppError>> {
    try {
      const result = await this.db.query<ResultSetHeader>(sql, params);

      if (result.isFailure) {
        return failure(result.error);
      }

      return success(result.value.affectedRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Update execution failed', { error: message, sql });

      return failure(
        new DatabaseError(
          `Update execution failed: ${message}`,
          { sql, originalError: message }
        )
      );
    }
  }

  /**
   * Execute a DELETE query
   */
  protected async executeDelete(
    sql: string,
    params: unknown[]
  ): Promise<Result<number, AppError>> {
    try {
      const result = await this.db.query<ResultSetHeader>(sql, params);

      if (result.isFailure) {
        return failure(result.error);
      }

      return success(result.value.affectedRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Delete execution failed', { error: message, sql });

      return failure(
        new DatabaseError(
          `Delete execution failed: ${message}`,
          { sql, originalError: message }
        )
      );
    }
  }

  /**
   * Find a single record by ID
   */
  protected async findOneById(id: number): Promise<Result<T | null, AppError>> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.select().from(this.tableName).whereEqual({ id }).limit(1).build();

    const result = await this.executeQuery<RowDataPacket[]>(sql, params);

    if (result.isFailure) {
      return failure(result.error);
    }

    if (result.value.length === 0) {
      return success(null);
    }

    const firstRow = result.value[0];
    if (!firstRow) {
      return success(null);
    }

    const entityResult = this.mapToDomain(firstRow);
    if (entityResult.isFailure) {
      return failure(entityResult.error);
    }

    return success(entityResult.value);
  }

  /**
   * Find records by condition
   */
  protected async findBy(
    conditions: Record<string, unknown>
  ): Promise<Result<T[], AppError>> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.select().from(this.tableName).whereEqual(conditions).build();

    const result = await this.executeQuery<RowDataPacket[]>(sql, params);

    if (result.isFailure) {
      return failure(result.error);
    }

    const entities: T[] = [];
    for (const row of result.value) {
      const entityResult = this.mapToDomain(row);
      if (entityResult.isFailure) {
        return failure(entityResult.error);
      }
      entities.push(entityResult.value);
    }

    return success(entities);
  }

  /**
   * Find all records with pagination
   */
  protected async findAllPaginated(
    params: PaginationParams,
    conditions?: Record<string, unknown>
  ): Promise<Result<PaginatedResult<T>, AppError>> {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // Get total count
    const countQb = this.createQueryBuilder();
    let countQuery = `SELECT COUNT(*) as total FROM \`${this.tableName}\``;
    let countParams: unknown[] = [];

    if (conditions) {
      const { sql, params: condParams } = countQb.whereEqual(conditions).build();
      countQuery = `SELECT COUNT(*) as total FROM \`${this.tableName}\` ${sql.split('FROM')[1] || ''}`;
      countParams = condParams;
    }

    const countResult = await this.executeQuery<RowDataPacket[]>(countQuery, countParams);

    if (countResult.isFailure) {
      return failure(countResult.error);
    }

    const total = (countResult.value[0] as { total: number }).total;

    // Get paginated data
    const dataQb = this.createQueryBuilder();
    let dataQuery = dataQb.select().from(this.tableName);

    if (conditions) {
      dataQuery = dataQuery.whereEqual(conditions);
    }

    const { sql, params: dataParams } = dataQuery.limit(limit).offset(offset).build();

    const dataResult = await this.executeQuery<RowDataPacket[]>(sql, dataParams);

    if (dataResult.isFailure) {
      return failure(dataResult.error);
    }

    const items: T[] = [];
    for (const row of dataResult.value) {
      const entityResult = this.mapToDomain(row);
      if (entityResult.isFailure) {
        return failure(entityResult.error);
      }
      items.push(entityResult.value);
    }


    return success(createPaginatedResult(items, total, { page, limit }));
  }

  /**
   * Check if record exists
   */
  protected async exists(conditions: Record<string, unknown>): Promise<Result<boolean, AppError>> {
    const sql = `SELECT EXISTS(SELECT 1 FROM \`${this.tableName}\` WHERE ${Object.keys(conditions)
      .map((key) => `\`${key}\` = ?`)
      .join(' AND ')}) as \`exists\``;

    const params = Object.values(conditions);

    const result = await this.executeQuery<RowDataPacket[]>(sql, params);

    if (result.isFailure) {
      return failure(result.error);
    }

    const exists = (result.value[0] as { exists: number }).exists === 1;
    return success(exists);
  }

  /**
   * Count records by condition
   */
  protected async countBy(conditions?: Record<string, unknown>): Promise<Result<number, AppError>> {
    let sql = `SELECT COUNT(*) as total FROM \`${this.tableName}\``;
    let params: unknown[] = [];

    if (conditions) {
      const whereClauses = Object.keys(conditions).map((key) => `\`${key}\` = ?`);
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
      params = Object.values(conditions);
    }

    const result = await this.executeQuery<RowDataPacket[]>(sql, params);

    if (result.isFailure) {
      return failure(result.error);
    }

    const count = (result.value[0] as { total: number }).total;
    return success(count);
  }
}
