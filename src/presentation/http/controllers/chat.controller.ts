/**
 * Chat Controller
 * Handles HTTP requests for chat message operations
 */

import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';
import { InvalidInputError } from '@/shared/errors/index.js';
import { ChatService } from '@/application/services/chat.service.js';
import {
  SendMessageDto,
  GetMessagesDto,
  DeleteMessageDto,
  MarkMessagesReadDto,
} from '@/application/dtos/chat.dto.js';

@injectable()
export class ChatController extends BaseController {
  constructor(
    @inject('ChatService') private readonly chatService: ChatService
  ) {
    super();
  }

  /**
   * Send a chat message
   * POST /api/chat/messages
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const dto: SendMessageDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.chatService.sendMessage(dto),
      201
    );
  };

  /**
   * Get single message
   * GET /api/chat/messages/:messageId
   * Note: This endpoint is commented out as getMessage is not implemented in ChatService
   */
  // getMessage = async (req: Request, res: Response): Promise<void> => {
  //   const messageId = req.params.messageId;
  //   if (!messageId) {
  //     this.sendError(res, new InvalidInputError('Message ID is required'));
  //     return;
  //   }
  //   // TODO: Implement getMessage in ChatService
  //   this.sendError(res, new InternalServerError('Not implemented'));
  // };

  /**
   * Get chat history with pagination
   * GET /api/rooms/:roomName/messages
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    const dto: GetMessagesDto = {
      room: roomName,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.chatService.getMessages(dto)
    );
  };

  /**
   * Delete a message
   * DELETE /api/chat/messages/:messageId
   */
  deleteMessage = async (req: Request, res: Response): Promise<void> => {
    const messageId = req.params.messageId;
    if (!messageId) {
      this.sendError(res, new InvalidInputError('Message ID is required'));
      return;
    }

    const dto: DeleteMessageDto = {
      messageId: parseInt(messageId),
      identity: req.body.identity || req.user?.identity || null,
    };

    await this.executeUseCase(
      req,
      res,
      async () => {
        const result = await this.chatService.deleteMessage(dto);
        if (result.isSuccess) {
          this.sendNoContent(res);
        }
        return result;
      }
    );
  };

  /**
   * Mark messages as read (clear unread count)
   * POST /api/rooms/:roomName/messages/read
   */
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    const dto: MarkMessagesReadDto = {
      room: roomName,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.chatService.markMessagesRead(dto)
    );
  };
}
