/**
 * Chat Routes
 * Defines HTTP routes for chat message operations
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { ChatController } from '../controllers/chat.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import {
  SendMessageDtoSchema,
  GetMessagesDtoSchema,
} from '@/application/dtos/chat.dto.js';
import { z } from 'zod';

const router = Router();
const chatController = container.resolve(ChatController);

// Message ID parameter schema
const messageIdSchema = z.object({
  messageId: z.string().regex(/^\d+$/),
});

/**
 * POST /api/chat/messages
 * Send a chat message
 */
router.post(
  '/messages',
  validateBody(SendMessageDtoSchema),
  chatController.sendMessage
);

/**
 * GET /api/chat/messages/:messageId
 * Get single message
 */
router.get(
  '/messages/:messageId',
  validateParams(messageIdSchema),
  chatController.getMessage
);

/**
 * DELETE /api/chat/messages/:messageId
 * Delete a message
 */
router.delete(
  '/messages/:messageId',
  validateParams(messageIdSchema),
  chatController.deleteMessage
);

export default router;
