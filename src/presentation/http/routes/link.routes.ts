/**
 * Link Routes
 * Defines HTTP routes for invitation link operations
 */

import { Router } from 'express';
import { container } from 'tsyringe';
import { LinkController } from '../controllers/link.controller.js';
import { validateBody, validateParams } from '../middlewares/validation.middleware.js';
import {
  CreateLinkDtoSchema,
  VerifyLinkDtoSchema,
  UpdateLinkLocationDtoSchema,
} from '@/application/dtos/link.dto.js';
import { z } from 'zod';

const router = Router();
const linkController = container.resolve(LinkController);

// Link ID parameter schema
const linkIdSchema = z.object({
  linkId: z.string().min(1),
});

/**
 * POST /api/links
 * Create invitation link
 */
router.post(
  '/',
  validateBody(CreateLinkDtoSchema),
  linkController.createLink
);

/**
 * GET /api/links/:linkId
 * Get link details
 */
router.get(
  '/:linkId',
  validateParams(linkIdSchema),
  linkController.getLink
);

/**
 * POST /api/links/:linkId/verify
 * Verify link access
 */
router.post(
  '/:linkId/verify',
  validateParams(linkIdSchema),
  validateBody(VerifyLinkDtoSchema),
  linkController.verifyLink
);

/**
 * PATCH /api/links/:linkId/location
 * Update GPS location
 */
router.patch(
  '/:linkId/location',
  validateParams(linkIdSchema),
  validateBody(UpdateLinkLocationDtoSchema),
  linkController.updateLocation
);

/**
 * POST /api/links/:linkId/mark-used
 * Mark one-time link as used
 */
router.post(
  '/:linkId/mark-used',
  validateParams(linkIdSchema),
  linkController.markUsed
);

export default router;
