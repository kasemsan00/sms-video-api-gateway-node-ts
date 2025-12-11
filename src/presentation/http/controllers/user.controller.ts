/**
 * User Controller
 * Handles HTTP requests for user operations
 */

import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';
import { InvalidInputError } from '@/shared/errors/index.js';
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
      this.sendError(res, new InvalidInputError('User identity is required'));
      return;
    }

    const dto: GetUserDto = {
      identity,
      
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
      this.sendError(res, new InvalidInputError('Room name is required'));
      return;
    }

    const dto: ListUsersDto = {
      room: roomName,
      onlineOnly: req.query.onlineOnly === 'true',
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
      this.sendError(res, new InvalidInputError('Room name and identity are required'));
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
