/**
 * Configuration exports
 * Central export point for all configuration
 */

// Environment validation
export { validateEnv, getEnv, type Env } from './env.validation.js';

// Database configuration
export { getDatabaseConfig, getTestDatabaseConfig } from './database.config.js';

// LiveKit configuration
export {
  getLivekitConfig,
  DEFAULT_ROOM_OPTIONS,
  DEFAULT_TOKEN_GRANTS,
  type LivekitConfig,
} from './livekit.config.js';

// Socket.IO configuration
export {
  getSocketConfig,
  SOCKET_NAMESPACES,
  SOCKET_EVENTS,
} from './socket.config.js';

// Application configuration
export {
  getAppConfig,
  isDevelopment,
  isProduction,
  isTest,
  type AppConfig,
} from './app.config.js';
