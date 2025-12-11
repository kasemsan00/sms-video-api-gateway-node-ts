/**
 * Base Controller
 * Provides common functionality for all HTTP controllers
 */

import { Request, Response } from 'express';
import { Result } from '@/shared/types/result.type.js';
import { AppError } from '@/shared/errors/base.error.js';
import { successResponse, errorResponse } from '@/shared/types/api-response.type.js';
import { log } from '@/shared/utils/logger.util.js';

export abstract class BaseController {
  /**
   * Execute a use case and send appropriate HTTP response
   */
  protected async executeUseCase<T>(
    req: Request,
    res: Response,
    useCase: () => Promise<Result<T, AppError>>,
    successStatusCode: number = 200
  ): Promise<void> {
    try {
      const result = await useCase();

      if (result.isSuccess) {
        this.sendSuccess(res, result.value, successStatusCode);
      } else {
        this.sendError(res, result.error);
      }
    } catch (error) {
      log.error('Unexpected error in controller', {
        error,
        path: req.path,
        method: req.method,
      });

      this.sendError(
        res,
        new AppError(
          'INTERNAL_ERROR',
          'An unexpected error occurred',
          500
        )
      );
    }
  }

  /**
   * Send success response
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    statusCode: number = 200
  ): void {
    res.status(statusCode).json(
      successResponse(data, {
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Send error response
   */
  protected sendError(res: Response, error: AppError): void {
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json(
      errorResponse(
        {
          code: error.code,
          message: error.message,
          details: error.details,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        {
          timestamp: new Date().toISOString(),
        }
      )
    );
  }

  /**
   * Send paginated response
   */
  protected sendPaginated<T>(
    res: Response,
    data: T,
    statusCode: number = 200
  ): void {
    res.status(statusCode).json(
      successResponse(data, {
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Send created response (201)
   */
  protected sendCreated<T>(res: Response, data: T): void {
    this.sendSuccess(res, data, 201);
  }

  /**
   * Send no content response (204)
   */
  protected sendNoContent(res: Response): void {
    res.status(204).send();
  }

  /**
   * Send accepted response (202)
   */
  protected sendAccepted<T>(res: Response, data: T): void {
    this.sendSuccess(res, data, 202);
  }
}
