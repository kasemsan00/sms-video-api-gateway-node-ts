/**
 * Express Application Setup
 * Configures Express server with middlewares and routes
 */

import express, { Express } from 'express';
import { json, urlencoded } from 'express';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import routes from './routes/index.js';
import { log as logger } from '@shared/utils/index.js';

export function createExpressApp(): Express {
  const app = express();

  // Trust proxy (for deployment behind reverse proxy)
  app.set('trust proxy', 1);

  // Body parsing middlewares
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS middleware
  app.use(corsMiddleware);

  // Request logging middleware
  app.use(requestLogger);

  // API routes
  app.use(routes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express application configured');

  return app;
}
