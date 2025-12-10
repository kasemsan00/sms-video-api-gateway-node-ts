/**
 * Auth Routes
 * Defines HTTP routes for authentication operations
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validation.middleware.js';
import {
  CreateTokenDtoSchema,
  VerifyTokenDtoSchema,
  RefreshTokenDtoSchema,
} from '@/application/dtos/auth.dto.js';

const router = Router();
const authController = container.resolve(AuthController);

/**
 * POST /api/auth/token
 * Create JWT token
 */
router.post(
  '/token',
  validateBody(CreateTokenDtoSchema),
  authController.createToken
);

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post(
  '/verify',
  validateBody(VerifyTokenDtoSchema),
  authController.verifyToken
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post(
  '/refresh',
  validateBody(RefreshTokenDtoSchema),
  authController.refreshToken
);

export default router;
