import mysql from "mysql2";
import util from "util";
import logger from "../../logger.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env.test when in test mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

// Check if we're in test mode
const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.VITEST;

if (isTestEnvironment) {
  // Load .env.test file for testing
  dotenv.config({ path: path.join(rootDir, ".env.test") });
  logger.info("Using test database configuration from .env.test");
} else {
  // Load regular .env file for production/development
  dotenv.config({ path: path.join(rootDir, ".env") });
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  charset: "utf8mb4_bin",
  multipleStatements: true,
  connectionLimit: 20,
});

pool.on("connection", (_conn) => {
  if (_conn) {
    logger.debug("Connected the database via threadId %s", _conn.threadId);
  }
});

pool.on("error", (err) => {
  logger.error("Database connection error %s", err);
});

function keepAlive() {
  pool.getConnection((err, connection) => {
    if (err) {
      if (err.code === "PROTOCOL_CONNECTION_LOST") {
        logger.error("Database connection was closed.");
      }
      if (err.code === "ER_CON_COUNT_ERROR") {
        logger.error("Database has too many connections.");
      }
      if (err.code === "ECONNREFUSED") {
        logger.error("Database connection was refused.");
      }
    }
    if (connection) {
      connection.release();
    }
  });
}

setInterval(keepAlive, 30000);

pool.query = util.promisify(pool.query);

/**
 * Establishes a database connection for testing purposes
 * @returns {Promise<void>} A promise that resolves when the connection is established
 */
const connectForTesting = async () => {
  // Force test environment
  process.env.NODE_ENV = "test";

  // If the pool was created before setting test environment, recreate it
  if (!isTestEnvironment) {
    // Load .env.test file for testing
    dotenv.config({ path: path.join(rootDir, ".env.test") });
    logger.info("Switched to test database configuration from .env.test");
  }

  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        logger.error("Error connecting to database for testing:", err);
        reject(err);
        return;
      }
      logger.debug("Database connection established for tests via threadId %s", connection.threadId);
      connection.release();
      resolve();
    });
  });
};

/**
 * Closes the database connection pool
 * @returns {Promise<void>} A promise that resolves when the connection pool is closed
 */
const closeConnection = async () => {
  return new Promise((resolve) => {
    pool.end(() => {
      logger.debug("Database connection pool closed");
      resolve();
    });
  });
};

export { connectForTesting, closeConnection };
export default pool;
