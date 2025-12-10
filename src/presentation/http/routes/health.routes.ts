/**
 * Health Routes
 * Defines HTTP routes for health check endpoints
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { HealthController } from '../controllers/health.controller.js';

const router = Router();
const healthController = container.resolve(HealthController);

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', healthController.healthCheck);

/**
 * GET /ready
 * Readiness check endpoint
 */
router.get('/ready', healthController.readinessCheck);

/**
 * GET /live
 * Liveness check endpoint
 */
router.get('/live', healthController.livenessCheck);

export default router;
