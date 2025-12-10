import winston, { createLogger, format, transports } from "winston";
// Add custom colors for log levels
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "cyan",
  http: "magenta",
  debug: "green",
});

const alignColorsAndTime = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);
const formatForFile = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.printf((info) => `${info.timestamp} : ${info.message}`),
);
const logger = createLogger({
  level: "debug",
  format: format.combine(format.colorize(), format.splat(), format.simple()),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), alignColorsAndTime),
    }),
    new transports.File({
      filename: "./logs/combined.log",
      format: alignColorsAndTime,
    }),
    new transports.File({
      filename: "./logs/warn.log",
      level: "warn",
      format: formatForFile,
    }),
    new transports.File({
      filename: "./logs/info.log",
      level: "info",
      format: formatForFile,
    }),
    new transports.File({
      filename: "./logs/errors.log",
      level: "error",
      format: formatForFile,
    }),
    new transports.File({
      filename: "./logs/debug.log",
      level: "debug",
      format: formatForFile,
    }),
    new transports.File({
      filename: "./logs/http.log",
      level: "http",
      format: formatForFile,
    }),
  ],
});
export default logger;
