/**
 * Record Controller
 * Handles HTTP requests for recording operations
 */

import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { BaseController } from './base.controller.js';
import { RecordService } from '@/application/services/record.service.js';
import {
  StartRecordingDto,
  StopRecordingDto,
  GetRecordingDto,
  ListRecordingsDto,
} from '@/application/dtos/record.dto.js';

@injectable()
export class RecordController extends BaseController {
  constructor(
    @inject('RecordService') private readonly recordService: RecordService
  ) {
    super();
  }

  /**
   * Start room recording
   * POST /api/rooms/:roomName/recording/start
   */
  startRecording = async (req: Request, res: Response): Promise<void> => {
    const dto: StartRecordingDto = {
      roomName: req.params.roomName,
      ...req.body,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.recordService.startRecording(dto),
      201
    );
  };

  /**
   * Stop room recording
   * POST /api/rooms/:roomName/recording/stop
   */
  stopRecording = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, { message: 'Room name is required' }, 400);
      return;
    }

    const dto: StopRecordingDto = {
      room: roomName,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.recordService.stopRecording(dto)
    );
  };

  /**
   * Get recording details
   * GET /api/recordings/:recordingId
   */
  getRecording = async (req: Request, res: Response): Promise<void> => {
    const egressId = req.params.egressId || req.params.recordingId;
    if (!egressId) {
      this.sendError(res, { message: 'Recording ID is required' }, 400);
      return;
    }

    const dto: GetRecordingDto = {
      egressId,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.recordService.getRecording(dto)
    );
  };

  /**
   * List recordings for a room
   * GET /api/rooms/:roomName/recordings
   */
  listRecordings = async (req: Request, res: Response): Promise<void> => {
    const roomName = req.params.roomName;
    if (!roomName) {
      this.sendError(res, { message: 'Room name is required' }, 400);
      return;
    }

    const dto: ListRecordingsDto = {
      room: roomName,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    await this.executeUseCase(
      req,
      res,
      () => this.recordService.listRecordings(dto)
    );
  };
}
