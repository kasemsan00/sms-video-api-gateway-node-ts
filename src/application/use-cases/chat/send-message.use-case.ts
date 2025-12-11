/**
 * Send Message Use Case
 * Sends a chat message in a room
 */

import { injectable, inject } from 'tsyringe';
import { SendMessageDto, MessageResponseDto } from '@application/dtos/index.js';
import { IMessageRepository } from '@domain/repositories/message.repository.interface.js';
import { IRoomRepository } from '@domain/repositories/room.repository.interface.js';
import { Message } from '@domain/entities/message.entity.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, RoomNotFoundError, ValidationError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for sending a chat message
 * Creates message entity, saves to database, and updates room unread count
 */
@injectable()
export class SendMessageUseCase {
  constructor(
    @inject('IMessageRepository') private messageRepository: IMessageRepository,
    @inject('IRoomRepository') private roomRepository: IRoomRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Send message data transfer object
   * @returns Result containing message response or error
   */
  async execute(dto: SendMessageDto): Promise<Result<MessageResponseDto, AppError>> {
    try {
      logger.info('Sending message', {
        room: dto.room,
        identity: dto.identity,
      });

      // Verify room exists
      const room = await this.roomRepository.findByName(dto.room);
      if (!room) {
        logger.warn('Room not found', { roomName: dto.room });
        return failure(new RoomNotFoundError(dto.room));
      }

      // Create message entity
      const messageResult = Message.create({
        room: dto.room,
        identity: dto.identity,
        name: dto.name,
        message: dto.message,
      });

      if (messageResult.isFailure) {
        logger.error('Failed to create message entity', {
          error: messageResult.error,
        });
        return failure(
          new ValidationError(
            messageResult.error.message,
            { details: messageResult.error }
          )
        );
      }

      const message = messageResult.value;

      // Save message to database
      const savedMessage = await this.messageRepository.create(message);

      // Update room unread count
      room.markMessageAsUnread();
      await this.roomRepository.update(room);

      logger.info('Message sent successfully', {
        messageId: savedMessage.id,
        room: dto.room,
        identity: dto.identity,
      });

      // Get reply-to message details if specified
      let replyTo: MessageResponseDto['replyTo'] | undefined;
      if (dto.replyToMessageId) {
        const replyToMessage = await this.messageRepository.findById(dto.replyToMessageId);
        if (replyToMessage) {
          replyTo = {
            messageId: replyToMessage.id,
            userName: replyToMessage.name,
            text: replyToMessage.message,
          };
        }
      }

      // Map to response DTO
      const response: MessageResponseDto = {
        id: savedMessage.id,
        room: savedMessage.room,
        identity: savedMessage.identity,
        name: savedMessage.name,
        message: savedMessage.message,
        isDeleted: savedMessage.isDeleted,
        replyTo,
        createdAt: savedMessage.createdAt,
        updatedAt: savedMessage.updatedAt,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error sending message', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to send message: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
