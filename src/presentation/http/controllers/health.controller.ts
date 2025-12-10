/**
 * Health Controller
 * Handles health check and status endpoints
 */

import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';

@injectable()
export class HealthController extends BaseController {
  /**
   * Health check endpoint
   * GET /health
   */
  healthCheck = async (_req: Request, res: Response): Promise<void> => {
    this.sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  };

  /**
   * Readiness check endpoint
   * GET /ready
   */
  readinessCheck = async (_req: Request, res: Response): Promise<void> => {
    // TODO: Add actual readiness checks (database, external services, etc.)
    this.sendSuccess(res, {
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Liveness check endpoint
   * GET /live
   */
  livenessCheck = async (_req: Request, res: Response): Promise<void> => {
    this.sendSuccess(res, {
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  };
}
