/**
 * Link Controller
 * Handles HTTP requests for invitation link operations
 */

import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';
import { LinkService } from '@/application/services/link.service.js';
import {
  CreateLinkDto,
  GetLinkDto,
  VerifyLinkDto,
  UpdateLinkLocationDto,
  ListLinksDto,
  MarkLinkUsedDto,
} from '@/application/dtos/link.dto.js';

@injectable()
export class LinkController extends BaseController {
  constructor(
    @inject('LinkService') private readonly linkService: LinkService
  ) {
    super();
  }

  /**
   * Create invitation link
   * POST /api/links
   */
  createLink = async (req: Request, res: Response): Promise<void> => {
    const dto: CreateLinkDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.linkService.createLink(dto),
      201
    );
  };

  /**
   * Get link details
   * GET /api/links/:linkId
   */
  getLink = async (req: Request, res: Response): Promise<void> => {
    const dto: GetLinkDto = {
      linkId: req.params.linkId,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.linkService.getLink(dto)
    );
  };

  /**
   * Verify link access
   * POST /api/links/:linkId/verify
   */
  verifyLink = async (req: Request, res: Response): Promise<void> => {
    const dto: VerifyLinkDto = {
      linkId: req.params.linkId,
      password: req.body.password,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.linkService.verifyLink(dto)
    );
  };

  /**
   * Update GPS location
   * PATCH /api/links/:linkId/location
   */
  updateLocation = async (req: Request, res: Response): Promise<void> => {
    const dto: UpdateLinkLocationDto = {
      linkId: req.params.linkId,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.linkService.updateLinkLocation(dto)
    );
  };

  /**
   * Mark one-time link as used
   * POST /api/links/:linkId/mark-used
   */
  markUsed = async (req: Request, res: Response): Promise<void> => {
    const dto: MarkLinkUsedDto = {
      linkId: req.params.linkId,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.linkService.markLinkUsed(dto)
    );
  };

  /**
   * List links for a room
   * GET /api/rooms/:roomName/links
   */
  listLinks = async (req: Request, res: Response): Promise<void> => {
    const dto: ListLinksDto = {
      room: req.params.roomName,
      linkType: req.query.linkType as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.linkService.listLinks(dto)
    );
  };
}
