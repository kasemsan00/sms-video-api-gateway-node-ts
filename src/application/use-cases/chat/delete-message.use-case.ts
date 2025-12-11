/**
 * Delete Message Use Case
 * Soft deletes a message (only by message owner)
 */

import { injectable, inject } from 'tsyringe';
import { DeleteMessageDto, MessageResponseDto } from '@application/dtos/index.js';
import { IMessageRepository } from '@domain/repositories/message.repository.interface.js';
import { Result, success, failure } from '@shared/types/index.js';
import { AppError, MessageNotFoundError, InsufficientPermissionsError, BusinessRuleViolationError, InternalServerError } from '@shared/errors/index.js';
import { logger } from '@shared/utils/index.js';

/**
 * Use case for deleting a message
 * Performs soft delete and verifies ownership
 */
@injectable()
export class DeleteMessageUseCase {
  constructor(
    @inject('IMessageRepository') private messageRepository: IMessageRepository
  ) {}

  /**
   * Execute the use case
   * @param dto Delete message data transfer object
   * @returns Result containing message response or error
   */
  async execute(dto: DeleteMessageDto): Promise<Result<MessageResponseDto, AppError>> {
    try {
      logger.info('Deleting message', {
        messageId: dto.messageId,
        identity: dto.identity,
      });

      // Find message by ID
      const message = await this.messageRepository.findById(dto.messageId);
      if (!message) {
        logger.warn('Message not found', { messageId: dto.messageId });
        return failure(new MessageNotFoundError(dto.messageId));
      }

      // Verify ownership
      if (!message.canBeDeletedBy(dto.identity)) {
        logger.warn('User not authorized to delete message', {
          messageId: dto.messageId,
          requestIdentity: dto.identity,
          ownerIdentity: message.identity,
        });
        return failure(
          new InsufficientPermissionsError('message.delete')
        );
      }

      // Soft delete the message
      const deleteResult = message.delete();
      if (deleteResult.isFailure) {
        logger.error('Failed to delete message', {
          messageId: dto.messageId,
          error: deleteResult.error,
        });
        return failure(
          new BusinessRuleViolationError(
            deleteResult.error.message,
            { details: deleteResult.error }
          )
        );
      }

      // Update message in database
      const updatedMessage = await this.messageRepository.update(message);

      logger.info('Message deleted successfully', {
        messageId: updatedMessage.id,
        identity: dto.identity,
      });

      // Map to response DTO
      const response: MessageResponseDto = {
        id: updatedMessage.id,
        room: updatedMessage.room,
        identity: updatedMessage.identity,
        name: updatedMessage.name,
        message: updatedMessage.message,
        isDeleted: updatedMessage.isDeleted,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt,
      };

      return success(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting message', { error: message, dto });

      return failure(
        new InternalServerError(
          `Failed to delete message: ${message}`,
          { originalError: message }
        )
      );
    }
  }
}
