/**
 * Link Application Service
 * Orchestrates link-related use cases
 */

import { injectable } from 'tsyringe';
import {
  CreateLinkUseCase,
  GetLinkUseCase,
  VerifyLinkUseCase,
  MarkLinkUsedUseCase,
  UpdateLinkLocationUseCase,
  ListLinksUseCase,
} from '../use-cases/link/index.js';
import {
  CreateLinkDto,
  GetLinkDto,
  VerifyLinkDto,
  MarkLinkUsedDto,
  UpdateLinkLocationDto,
  ListLinksDto,
  CreateLinkResponseDto,
  LinkResponseDto,
} from '../dtos/index.js';
import { Result } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';

/**
 * Link Service
 * High-level service for link operations
 */
@injectable()
export class LinkService {
  constructor(
    private createLinkUseCase: CreateLinkUseCase,
    private getLinkUseCase: GetLinkUseCase,
    private verifyLinkUseCase: VerifyLinkUseCase,
    private markLinkUsedUseCase: MarkLinkUsedUseCase,
    private updateLinkLocationUseCase: UpdateLinkLocationUseCase,
    private listLinksUseCase: ListLinksUseCase
  ) {}

  /**
   * Create a new link
   */
  async createLink(dto: CreateLinkDto): Promise<Result<CreateLinkResponseDto, AppError>> {
    return this.createLinkUseCase.execute(dto);
  }

  /**
   * Get link details
   */
  async getLink(dto: GetLinkDto): Promise<Result<LinkResponseDto, AppError>> {
    return this.getLinkUseCase.execute(dto);
  }

  /**
   * Verify link access
   */
  async verifyLink(dto: VerifyLinkDto): Promise<Result<LinkResponseDto, AppError>> {
    return this.verifyLinkUseCase.execute(dto);
  }

  /**
   * Mark link as used
   */
  async markLinkUsed(dto: MarkLinkUsedDto): Promise<Result<void, AppError>> {
    return this.markLinkUsedUseCase.execute(dto);
  }

  /**
   * Update link location
   */
  async updateLinkLocation(dto: UpdateLinkLocationDto): Promise<Result<LinkResponseDto, AppError>> {
    return this.updateLinkLocationUseCase.execute(dto);
  }

  /**
   * List links for a room
   */
  async listLinks(dto: ListLinksDto): Promise<Result<LinkResponseDto[], AppError>> {
    return this.listLinksUseCase.execute(dto);
  }
}
