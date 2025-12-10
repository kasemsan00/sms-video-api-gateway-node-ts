/**
 * Record Routes
 * Defines HTTP routes for recording operations
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { RecordController } from '../controllers/record.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware.js';
import {
  StartRecordingDtoSchema,
  ListRecordingsDtoSchema,
} from '@/application/dtos/record.dto.js';
import { z } from 'zod';

const router = Router();
const recordController = container.resolve(RecordController);

// Recording ID parameter schema
const recordingIdSchema = z.object({
  recordingId: z.string().min(1),
});

/**
 * GET /api/recordings/:recordingId
 * Get recording details
 */
router.get(
  '/:recordingId',
  validateParams(recordingIdSchema),
  recordController.getRecording
);

export default router;
