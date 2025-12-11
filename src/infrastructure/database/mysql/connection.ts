/**
 * Database Connection
 * MySQL connection pool management with singleton pattern
 */

import mysql, { Pool, PoolOptions, RowDataPacket } from 'mysql2/promise';
import { log as logger } from '@shared/utils/index.js';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    const config: PoolOptions = {
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'video_conference',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      charset: 'utf8mb4',
      connectionLimit: 20,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };

    this.pool = mysql.createPool(config);
    this.setupEventHandlers();
    this.startKeepAlive();

    logger.info('Database connection pool created', {
      host: config.host,
      database: config.database,
      connectionLimit: config.connectionLimit,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Get connection pool
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Execute a query
   */
  public async query<T extends RowDataPacket[] = RowDataPacket[]>(
    sql: string,
    params?: any[]
  ): Promise<T> {
    try {
      const [rows] = await this.pool.execute<T>(sql, params);
      return rows;
    } catch (error) {
      logger.error('Database query error', { error, sql, params });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      logger.error('Transaction error', { error });
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<void> {
    try {
      await this.pool.execute('SELECT 1');
      logger.info('Database connection test successful');
    } catch (error) {
      logger.error('Database connection test failed', { error });
      throw error;
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.pool.on('connection', (connection: any) => {
      logger.debug('New database connection established', {
        threadId: connection.threadId,
      });
    });

    this.pool.on('error', (error) => {
      logger.error('Database pool error', { error });
    });
  }

  /**
   * Start keep-alive ping
   */
  private startKeepAlive(): void {
    setInterval(async () => {
      try {
        await this.pool.execute('SELECT 1');
        logger.debug('Database keep-alive ping successful');
      } catch (error) {
        logger.error('Database keep-alive ping failed', { error });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Close connection pool
   */
  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection pool closed');
    } catch (error) {
      logger.error('Error closing database pool', { error });
      throw error;
    }
  }

  /**
   * Get pool statistics
   */
  public getStats() {
    return {
      // @ts-ignore - accessing private properties
      totalConnections: this.pool.pool._allConnections.length,
      // @ts-ignore
      freeConnections: this.pool.pool._freeConnections.length,
      // @ts-ignore
      queuedRequests: this.pool.pool._connectionQueue.length,
    };
  }
}

// Export singleton instance
export const db = DatabaseConnection.getInstance();
