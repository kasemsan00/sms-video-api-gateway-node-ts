/**
 * Chat Application Service
 * Orchestrates chat-related use cases
 */

import { injectable } from 'tsyringe';
import {
  SendMessageUseCase,
  GetMessagesUseCase,
  DeleteMessageUseCase,
  MarkMessagesReadUseCase,
} from '../use-cases/chat/index.js';
import {
  SendMessageDto,
  GetMessagesDto,
  DeleteMessageDto,
  MarkMessagesReadDto,
  MessageResponseDto,
  GetMessagesResponseDto,
  RoomResponseDto,
} from '../dtos/index.js';
import { Result } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';

/**
 * Chat Service
 * High-level service for chat operations
 */
@injectable()
export class ChatService {
  constructor(
    private sendMessageUseCase: SendMessageUseCase,
    private getMessagesUseCase: GetMessagesUseCase,
    private deleteMessageUseCase: DeleteMessageUseCase,
    private markMessagesReadUseCase: MarkMessagesReadUseCase
  ) {}

  /**
   * Send a message
   */
  async sendMessage(dto: SendMessageDto): Promise<Result<MessageResponseDto, AppError>> {
    return this.sendMessageUseCase.execute(dto);
  }

  /**
   * Get messages for a room
   */
  async getMessages(dto: GetMessagesDto): Promise<Result<GetMessagesResponseDto, AppError>> {
    return this.getMessagesUseCase.execute(dto);
  }

  /**
   * Delete a message
   */
  async deleteMessage(dto: DeleteMessageDto): Promise<Result<MessageResponseDto, AppError>> {
    return this.deleteMessageUseCase.execute(dto);
  }

  /**
   * Mark messages as read
   */
  async markMessagesRead(dto: MarkMessagesReadDto): Promise<Result<RoomResponseDto, AppError>> {
    return this.markMessagesReadUseCase.execute(dto);
  }
}
