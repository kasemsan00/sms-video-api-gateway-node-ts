/**
 * User Routes
 * Defines HTTP routes for user operations
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { UserController } from '../controllers/user.controller.js';
import { validateBody, validateParams } from '../middlewares/validation.middleware.js';
import {
  GenerateTokenDtoSchema,
  JoinRoomDtoSchema,
  LeaveRoomDtoSchema,
} from '@/application/dtos/user.dto.js';
import { z } from 'zod';

const router = Router();
const userController = container.resolve(UserController);

// Identity parameter schema
const identitySchema = z.object({
  identity: z.string().min(1),
});

/**
 * POST /api/users/token
 * Generate LiveKit access token
 */
router.post(
  '/token',
  validateBody(GenerateTokenDtoSchema),
  userController.generateToken
);

/**
 * POST /api/users/join
 * User joins a room
 */
router.post(
  '/join',
  validateBody(JoinRoomDtoSchema),
  userController.joinRoom
);

/**
 * POST /api/users/leave
 * User leaves a room
 */
router.post(
  '/leave',
  validateBody(LeaveRoomDtoSchema),
  userController.leaveRoom
);

/**
 * GET /api/users/:identity
 * Get user details
 */
router.get(
  '/:identity',
  validateParams(identitySchema),
  userController.getUser
);

export default router;
