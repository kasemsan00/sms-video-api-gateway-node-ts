/**
 * Create Link Use Case
 * Creates an invitation link for joining a room
 */

import { injectable, inject } from 'tsyringe';
import { CreateLinkDto, CreateLinkResponseDto } from '@application/dtos/index.js';
import { ILinkRepository } from '@domain/repositories/link.repository.interface.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { Link } from '@domain/entities/link.entity.js';
import { SmsAdapter } from '@infrastructure/adapters/sms/sms.adapter.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError } from '@shared/errors/index.js';
import { ErrorCode, LinkType } from '@shared/constants/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for creating invitation link
 * Creates link entity, saves to database, and optionally sends SMS
 */
@injectable()
export class CreateLinkUseCase {
  constructor(
    @inject('ILinkRepository') private linkRepository: ILinkRepository,
    @inject('IRoomRepository') private roomRepository: IRoomRepository,
    @inject(SmsAdapter) private smsAdapter: SmsAdapter
  ) {}

  /**
   * Execute the use case
   * @param dto Create link data transfer object
   * @returns Result containing link response or error
   */
  async execute(dto: CreateLinkDto): Promise<Result<CreateLinkResponseDto, AppError>> {
    try {
      logger.info('Creating invitation link', { dto });

      // Verify room exists
      const room = await this.roomRepository.findByName(dto.room);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.room });
        return failure(new RoomNotFoundError(dto.room));
      }

      // Calculate expiry date if specified
      let expiresAt: Date | undefined;
      if (dto.expiresInDays) {
        const now = new Date();
        expiresAt = new Date(now.getTime() + dto.expiresInDays * 24 * 60 * 60 * 1000);
      }

      // Create link entity
      const linkResult = Link.create({
        room: dto.room,
        mobile: dto.mobile,
        userType: dto.userType,
        linkType: dto.linkType,
        userName: dto.userName,
        isAdmin: dto.isAdmin,
        requireJoinPermission: dto.requireJoinPermission,
        requireUserName: dto.requireUserName,
        password: dto.password,
        oneTimeLink: dto.oneTimeLink,
        expiresAt,
      });

      if (linkResult.isFailure) {
        logger.error('Failed to create link entity', { error: linkResult.error });
        return failure(
          new AppError(
            ErrorCode.VALIDATION_ERROR,
            linkResult.error.message,
            400,
            { details: linkResult.error }
          )
        );
      }

      const link = linkResult.value;

      // Save link to database
      const savedLink = await this.linkRepository.create(link);

      // Build full URL
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const url = `${baseUrl}/join/${savedLink.linkId}`;

      logger.info('Link created successfully', {
        linkId: savedLink.linkId,
        room: savedLink.room,
        url,
      });

      // Send SMS if requested and mobile provided
      let smsSent = false;
      let smsMessageId: string | undefined;

      if (dto.sendSms && dto.mobile) {
        logger.info('Sending invitation SMS', {
          linkId: savedLink.linkId,
          mobile: dto.mobile,
        });

        const smsResult = savedLink.linkType === LinkType.LOCATION
          ? await this.smsAdapter.sendLocationInvitation(dto.mobile, url)
          : await this.smsAdapter.sendVideoCallInvitation(dto.mobile, url);

        if (smsResult.isSuccess) {
          smsSent = true;
          smsMessageId = smsResult.value.messageId;
          logger.info('SMS sent successfully', {
            linkId: savedLink.linkId,
            messageId: smsMessageId,
          });
        } else {
          logger.error('Failed to send SMS', {
            linkId: savedLink.linkId,
            error: smsResult.error,
          });
          // Don't fail the entire operation if SMS fails
        }
      }

      // Map to response DTO
      const response: CreateLinkResponseDto = {
        linkId: savedLink.linkId,
        room: savedLink.room,
        mobile: savedLink.mobile,
        userType: savedLink.userType,
        linkType: savedLink.linkType,
        userName: savedLink.userName,
        isAdmin: savedLink.isAdmin,
        requireJoinPermission: savedLink.requireJoinPermission,
        requireUserName: savedLink.requireUserName,
        oneTimeLink: savedLink.oneTimeLink,
        isUsed: savedLink.isUsed,
        latitude: savedLink.latitude,
        longitude: savedLink.longitude,
        accuracy: savedLink.accuracy,
        createdAt: savedLink.createdAt,
        updatedAt: savedLink.updatedAt,
        expiresAt: savedLink.expiresAt,
        url,
        smsSent,
        smsMessageId,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating link', { error: message, dto });

      return failure(
        new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          `Failed to create link: ${message}`,
          500,
          { originalError: message }
        )
      );
    }
  }
}
