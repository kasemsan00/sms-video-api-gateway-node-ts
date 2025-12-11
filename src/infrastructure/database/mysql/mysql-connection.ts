/**
 * MySQL Connection Manager
 * Handles database connection pooling and lifecycle
 */

import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getDatabaseConfig } from '@config/database.config.js';
import { log as logger } from '@shared/utils/index.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError, DatabaseError } from '@shared/errors/index.js';

/**
 * MySQL Connection Manager
 * Singleton pattern for managing database connection pool
 */
export class MySqlConnection {
  private static instance: MySqlConnection | null = null;
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MySqlConnection {
    if (!MySqlConnection.instance) {
      MySqlConnection.instance = new MySqlConnection();
    }
    return MySqlConnection.instance;
  }

  /**
   * Initialize and connect to database
   */
  public async connect(): Promise<Result<void, AppError>> {
    try {
      if (this.isConnected && this.pool) {
        logger.warn('Database already connected');
        return success(undefined);
      }

      const config = getDatabaseConfig();
      this.pool = mysql.createPool(config);

      // Test connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      this.isConnected = true;
      logger.info('Database connected successfully', {
        host: config.host,
        database: config.database,
      });

      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to connect to database', { error: message });

      return failure(
        new DatabaseError(`Failed to connect to database: ${message}`, { originalError: message })
      );
    }
  }

  /**
   * Get connection pool
   */
  public getPool(): Pool {
    if (!this.pool || !this.isConnected) {
      throw new DatabaseError('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  /**
   * Get a connection from the pool
   */
  public async getConnection(): Promise<Result<PoolConnection, AppError>> {
    try {
      if (!this.pool || !this.isConnected) {
        return failure(
          new DatabaseError('Database not connected. Call connect() first.')
        );
      }

      const connection = await this.pool.getConnection();
      return success(connection);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get database connection', { error: message });

      return failure(
        new DatabaseError(`Failed to get database connection: ${message}`, { originalError: message })
      );
    }
  }

  /**
   * Execute a query with parameters
   */
  public async query<T extends RowDataPacket[] | ResultSetHeader>(
    sql: string,
    params?: unknown[]
  ): Promise<Result<T, AppError>> {
    try {
      if (!this.pool || !this.isConnected) {
        return failure(
          new DatabaseError('Database not connected. Call connect() first.')
        );
      }

      const [results] = await this.pool.execute<T>(sql, params);
      return success(results);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Database query failed', {
        error: message,
        sql: sql.substring(0, 100), // Log first 100 chars of SQL
      });

      return failure(
        new DatabaseError(`Database query failed: ${message}`, { originalError: message, sql })
      );
    }
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>
  ): Promise<Result<T, AppError>> {
    const connectionResult = await this.getConnection();
    if (connectionResult.isFailure) {
      return failure(connectionResult.error);
    }

    const connection = connectionResult.value;

    try {
      await connection.beginTransaction();

      const result = await callback(connection);

      await connection.commit();
      connection.release();

      return success(result);
    } catch (error) {
      await connection.rollback();
      connection.release();

      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Transaction failed', { error: message });

      return failure(
        new DatabaseError(`Transaction failed: ${message}`, { originalError: message })
      );
    }
  }

  /**
   * Check if database is connected
   */
  public async healthCheck(): Promise<Result<boolean, AppError>> {
    try {
      if (!this.pool || !this.isConnected) {
        return failure(
          new DatabaseError('Database not connected')
        );
      }

      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      return success(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(
        new DatabaseError(`Health check failed: ${message}`, { originalError: message })
      );
    }
  }

  /**
   * Close database connection
   */
  public async disconnect(): Promise<Result<void, AppError>> {
    try {
      if (!this.pool) {
        logger.warn('No database connection to close');
        return success(undefined);
      }

      await this.pool.end();
      this.pool = null;
      this.isConnected = false;

      logger.info('Database disconnected successfully');
      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to disconnect from database', { error: message });

      return failure(
        new DatabaseError(`Failed to disconnect: ${message}`, { originalError: message })
      );
    }
  }

  /**
   * Get connection status
   */
  public isConnectionActive(): boolean {
    return this.isConnected && this.pool !== null;
  }
}

/**
 * Export singleton instance
 */
export const db = MySqlConnection.getInstance();
