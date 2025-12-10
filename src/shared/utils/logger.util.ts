/**
 * Logger utilities
 * Winston logger wrapper with TypeScript types
 */

import winston, { Logger as WinstonLogger } from 'winston';
import path from 'path';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level?: LogLevel;
  logDir?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
}

// Add custom colors for log levels
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  http: 'magenta',
  debug: 'green',
});

/**
 * Create a formatted timestamp
 */
const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss',
});

/**
 * Console format with colors
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  timestampFormat,
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

/**
 * File format without colors
 */
const fileFormat = winston.format.combine(
  timestampFormat,
  winston.format.printf((info) => `${info.timestamp} : ${info.message}`)
);

/**
 * Create logger instance
 */
const createLoggerInstance = (config: LoggerConfig = {}): WinstonLogger => {
  const {
    level = LogLevel.DEBUG,
    logDir = './logs',
    enableConsole = true,
    enableFile = true,
  } = config;

  const transportsList: winston.transport[] = [];

  // Console transport
  if (enableConsole) {
    transportsList.push(
      new winston.transports.Console({
        format: consoleFormat,
      })
    );
  }

  // File transports
  if (enableFile) {
    transportsList.push(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: consoleFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'warn.log'),
        level: 'warn',
        format: fileFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'info.log'),
        level: 'info',
        format: fileFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'errors.log'),
        level: 'error',
        format: fileFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'debug.log'),
        level: 'debug',
        format: fileFormat,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'http.log'),
        level: 'http',
        format: fileFormat,
      })
    );
  }

  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.splat(),
      winston.format.simple()
    ),
    transports: transportsList,
  });
};

/**
 * Default logger instance
 */
const logger = createLoggerInstance();

/**
 * Logger interface with typed methods
 */
export interface Logger {
  error(message: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  info(message: string, ...meta: unknown[]): void;
  http(message: string, ...meta: unknown[]): void;
  debug(message: string, ...meta: unknown[]): void;
}

/**
 * Wrap winston logger with typed interface
 */
class TypedLogger implements Logger {
  constructor(private winstonLogger: WinstonLogger) {}

  error(message: string, ...meta: unknown[]): void {
    this.winstonLogger.error(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.winstonLogger.warn(message, ...meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.winstonLogger.info(message, ...meta);
  }

  http(message: string, ...meta: unknown[]): void {
    this.winstonLogger.http(message, ...meta);
  }

  debug(message: string, ...meta: unknown[]): void {
    this.winstonLogger.debug(message, ...meta);
  }
}

/**
 * Export default logger instance
 */
export const log = new TypedLogger(logger);

/**
 * Create a child logger with a specific context
 *
 * @param context - Context label for the logger
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const roomLogger = createContextLogger('RoomService');
 * roomLogger.info('Room created', { roomId: '123' });
 * // Output: "2024-01-15 10:30:00 info: [RoomService] Room created"
 * ```
 */
export const createContextLogger = (context: string): Logger => {
  const childLogger = logger.child({ context });
  return new TypedLogger(childLogger as WinstonLogger);
};

/**
 * Export winston logger for backward compatibility
 */
export default logger;
