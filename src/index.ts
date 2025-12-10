/**
 * Application Entry Point
 * Initializes and starts the application
 */

import "reflect-metadata";
import { config } from "dotenv";
import { createServer } from "./presentation/server.js";
import { logger } from "./shared/utils/logger.util.js";
import { DatabaseConnection } from "./infrastructure/database/mysql/connection.js";

// Load environment variables
config();

// Application configuration
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Bootstrap application
 */
async function bootstrap(): Promise<void> {
  try {
    logger.info("Starting application...", {
      environment: NODE_ENV,
      port: PORT,
    });

    // Initialize database connection
    logger.info("Connecting to database...");
    const db = DatabaseConnection.getInstance();
    await db.testConnection();
    logger.info("Database connected successfully");

    // Create and start server
    const server = createServer(PORT);
    await server.start();

    logger.info("Application started successfully", {
      port: PORT,
      environment: NODE_ENV,
    });

    // Graceful shutdown handlers
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error("Failed to start application", { error });
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server: ReturnType<typeof createServer>): void {
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown...`);

    try {
      // Stop accepting new connections
      await server.stop();

      // Close database connection
      const db = DatabaseConnection.getInstance();
      await db.close();

      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", { error });
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception", { error });
    shutdown("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled rejection", { reason, promise });
    shutdown("UNHANDLED_REJECTION");
  });
}

// Start application
bootstrap();
