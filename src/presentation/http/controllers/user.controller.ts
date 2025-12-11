/**
 * User Controller
 * Handles HTTP requests for user operations
 */

import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';
import { UserService } from '@/application/services/user.service.js';
import {
  GenerateTokenDto,
  JoinRoomDto,
  LeaveRoomDto,
  GetUserDto,
  ListUsersDto,
} from '@/application/dtos/user.dto.js';

@injectable()
export class UserController extends BaseController {
  constructor(
    @inject('UserService') private readonly userService: UserService
  ) {
    super();
  }

  /**
   * Generate LiveKit access token
   * POST /api/users/token
   */
  generateToken = async (req: Request, res: Response): Promise<void> => {
    const dto: GenerateTokenDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.userService.generateToken(dto),
      201
    );
  };

  /**
   * User joins a room
   * POST /api/users/join
   */
  joinRoom = async (req: Request, res: Response): Promise<void> => {
    const dto: JoinRoomDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.userService.joinRoom(dto),
      201
    );
  };

  /**
   * User leaves a room
   * POST /api/users/leave
   */
  leaveRoom = async (req: Request, res: Response): Promise<void> => {
    const dto: LeaveRoomDto = req.body;

    await this.executeUseCase(
      req,
      res,
      () => this.userService.leaveRoom(dto)
    );
  };

  /**
   * Get user details
   * GET /api/users/:identity
   */
  getUser = async (req: Request, res: Response): Promise<void> => {
    const identity = req.params.identity;
    if (!identity) {
      this.sendError(res, { message: 'User identity is required' }, 400);
      return;
    }

    const dto: GetUserDto = {
      identity,
      room: (req.query.room as string) || undefined,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.userService.getUser(dto)
    );
  };

  /**
   * List users in a room
   * GET /api/rooms/:roomName/users
   */
  listUsers = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, { message: 'Room name is required' }, 400);
      return;
    }

    const dto: ListUsersDto = {
      room: roomName,
      userType: (req.query.userType as string) || undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.userService.listUsers(dto)
    );
  };

  /**
   * Remove user from room
   * DELETE /api/rooms/:roomName/users/:identity
   */
  removeUser = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    const identity = req.params.identity;
    if (!roomName || !identity) {
      this.sendError(res, { message: 'Room name and identity are required' }, 400);
      return;
    }

    const dto: LeaveRoomDto = {
      room: roomName,
      identity,
    };

    await this.executeUseCase(
      req,
      res,
      async () => {
        const result = await this.userService.leaveRoom(dto);
        if (result.isSuccess) {
          this.sendNoContent(res);
        }
        return result;
      }
    );
  };
}
