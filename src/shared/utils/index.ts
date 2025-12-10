/**
 * Utilities exports
 * Central export point for all utility functions
 */

// ID Generator
export {
  generateId,
  generateRoomName,
  generateLinkId,
  generateUserIdentity,
  generateViewerIdentity,
  generateUUID,
  generateGuestName,
  generateUserName,
} from './id-generator.util.js';

// Date utilities
export {
  DEFAULT_TIMEZONE,
  DATE_FORMATS,
  now,
  formatDate,
  parseDate,
  addDuration,
  subtractDuration,
  isDateExpired,
  isDateInFuture,
  getDateDifference,
  getExpiryDate,
  toMySQLDateTime,
  toISO,
} from './date.util.js';

// Crypto utilities
export {
  md5Hash,
  sha256Hash,
  generateRandomToken,
  randomInt,
  constantTimeCompare,
  verifyMd5Hash,
} from './crypto.util.js';

// Logger
export {
  log,
  createContextLogger,
  LogLevel,
  type Logger,
} from './logger.util.js';

// Default logger export
export { default as logger } from './logger.util.js';
