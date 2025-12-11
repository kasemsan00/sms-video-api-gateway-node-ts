/**
 * Chat Controller
 * Handles HTTP requests for chat message operations
 */

import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';
import { ChatService } from '@/application/services/chat.service.js';
import {
  SendMessageDto,
  GetMessageDto,
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
   */
  getMessage = async (req: Request, res: Response): Promise<void> => {
    const messageId = req.params.messageId;
    if (!messageId) {
      this.sendError(res, { message: 'Message ID is required' }, 400);
      return;
    }

    const dto: GetMessageDto = {
      messageId: parseInt(messageId),
    };

    await this.executeUseCase(
      req,
      res,
      () => this.chatService.getMessage(dto)
    );
  };

  /**
   * Get chat history with pagination
   * GET /api/rooms/:roomName/messages
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, { message: 'Room name is required' }, 400);
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
      this.sendError(res, { message: 'Message ID is required' }, 400);
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
      this.sendError(res, { message: 'Room name is required' }, 400);
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
