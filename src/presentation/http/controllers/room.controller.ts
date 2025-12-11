/**
 * Room Controller
 * Handles HTTP requests for room operations
 */

import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';
import { InvalidInputError } from '@/shared/errors/index.js';
import { RoomService } from '@/application/services/room.service.js';
import {
  CreateRoomDto,
  CloseRoomDto,
  ReopenRoomDto,
  GetRoomDto,
  ExtendRoomExpiryDto,
  ListRoomsDto,
} from '@/application/dtos/room.dto.js';

@injectable()
export class RoomController extends BaseController {
  constructor(
    @inject('RoomService') private readonly roomService: RoomService
  ) {
    super();
  }

  /**
   * Create a new room
   * POST /api/rooms
   */
  createRoom = async (req: Request, res: Response): Promise<void> => {
    const dto: CreateRoomDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.roomService.createRoom(dto),
      201 // Created
    );
  };

  /**
   * Get room details
   * GET /api/rooms/:roomName
   */
  getRoom = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    const dto: GetRoomDto = {
      roomName,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.roomService.getRoom(dto)
    );
  };

  /**
   * List rooms with pagination
   * GET /api/rooms
   */
  listRooms = async (req: Request, res: Response): Promise<void> => {
    const dto: ListRoomsDto = req.query as any;

    await this.executeUseCase(
      req,
      res,
      () => this.roomService.listRooms(dto)
    );
  };

  /**
   * Update room settings
   * PATCH /api/rooms/:roomName
   */
  updateRoom = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    // const dto: UpdateRoomDto = {
    //   roomName: req.params.roomName,
    // };

    // Note: updateRoom method doesn't exist on RoomService, this might need to be implemented
    this.sendError(res, new InvalidInputError('Update room not implemented'));
  };

  /**
   * Close a room
   * POST /api/rooms/:roomName/close
   */
  closeRoom = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    const dto: CloseRoomDto = {
      roomName,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.roomService.closeRoom(dto)
    );
  };

  /**
   * Reopen a closed room
   * POST /api/rooms/:roomName/reopen
   */
  reopenRoom = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    const dto: ReopenRoomDto = {
      roomName,
      
    };

    await this.executeUseCase(
      req,
      res,
      () => this.roomService.reopenRoom(dto)
    );
  };

  /**
   * Extend room expiry
   * POST /api/rooms/:roomName/extend
   */
  extendExpiry = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    const dto: ExtendRoomExpiryDto = {
      roomName,
      days: req.body.days,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.roomService.extendRoomExpiry(dto)
    );
  };

  /**
   * Delete a room
   * DELETE /api/rooms/:roomName
   */
  deleteRoom = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    const dto: CloseRoomDto = {
      roomName,
    };

    await this.executeUseCase(
      req,
      res,
      async () => {
        const result = await this.roomService.closeRoom(dto);
        if (result.isSuccess) {
          this.sendNoContent(res);
        }
        return result;
      }
    );
  };
}
