/**
 * Database configuration
 */

import type { PoolOptions } from 'mysql2/promise';
import { getEnv } from './env.validation.js';

/**
 * MySQL connection pool configuration
 */
export const getDatabaseConfig = (): PoolOptions => {
  const env = getEnv();

  return {
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    port: env.MYSQL_PORT,
    charset: 'utf8mb4',
    connectionLimit: 20,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
};

/**
 * Database configuration for test environment
 */
export const getTestDatabaseConfig = (): PoolOptions => {
  // In test environment, use .env.test values
  return getDatabaseConfig();
};
