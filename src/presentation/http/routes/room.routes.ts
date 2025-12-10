/**
 * Room Routes
 * Defines HTTP routes for room operations
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { RoomController } from '../controllers/room.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import {
  CreateRoomDtoSchema,
  UpdateRoomDtoSchema,
  ExtendRoomExpiryDtoSchema,
  ListRoomsDtoSchema,
} from '@/application/dtos/room.dto.js';
import { z } from 'zod';

const router = Router();
const roomController = container.resolve(RoomController);

// Room name parameter schema
const roomNameSchema = z.object({
  roomName: z.string().min(1).max(50),
});

/**
 * POST /api/rooms
 * Create a new room
 */
router.post(
  '/',
  validateBody(CreateRoomDtoSchema),
  roomController.createRoom
);

/**
 * GET /api/rooms
 * List rooms with pagination
 */
router.get(
  '/',
  validateQuery(ListRoomsDtoSchema),
  roomController.listRooms
);

/**
 * GET /api/rooms/:roomName
 * Get room details
 */
router.get(
  '/:roomName',
  validateParams(roomNameSchema),
  roomController.getRoom
);

/**
 * PATCH /api/rooms/:roomName
 * Update room settings
 */
router.patch(
  '/:roomName',
  validateParams(roomNameSchema),
  validateBody(UpdateRoomDtoSchema),
  roomController.updateRoom
);

/**
 * POST /api/rooms/:roomName/close
 * Close a room
 */
router.post(
  '/:roomName/close',
  validateParams(roomNameSchema),
  roomController.closeRoom
);

/**
 * POST /api/rooms/:roomName/reopen
 * Reopen a closed room
 */
router.post(
  '/:roomName/reopen',
  validateParams(roomNameSchema),
  roomController.reopenRoom
);

/**
 * POST /api/rooms/:roomName/extend
 * Extend room expiry
 */
router.post(
  '/:roomName/extend',
  validateParams(roomNameSchema),
  validateBody(ExtendRoomExpiryDtoSchema),
  roomController.extendExpiry
);

/**
 * DELETE /api/rooms/:roomName
 * Delete a room
 */
router.delete(
  '/:roomName',
  validateParams(roomNameSchema),
  roomController.deleteRoom
);

export default router;
