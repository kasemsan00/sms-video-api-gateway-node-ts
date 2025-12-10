/**
 * Application configuration
 */

import { getEnv } from './env.validation.js';

/**
 * Application configuration interface
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiUrl?: string;
  roomDayDefaultTimeout: number;
  autoCloseRoom: boolean;
  joinRoomRepeatDelay: number;
  fileSizeLimit?: number;
  egressLimit: number;
}

/**
 * Get application configuration from environment
 */
export const getAppConfig = (): AppConfig => {
  const env = getEnv();

  return {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    apiUrl: env.API_URL,
    roomDayDefaultTimeout: env.ROOM_DAY_DEFAULT_TIMEOUT,
    autoCloseRoom: env.AUTO_CLOSE_ROOM,
    joinRoomRepeatDelay: env.JOIN_ROOM_REPEAT_DELAY,
    fileSizeLimit: env.FILE_SIZE_LIMIT,
    egressLimit: env.EGRESS_LIMIT,
  };
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnv().NODE_ENV === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return getEnv().NODE_ENV === 'production';
};

/**
 * Check if running in test mode
 */
export const isTest = (): boolean => {
  return getEnv().NODE_ENV === 'test';
};
