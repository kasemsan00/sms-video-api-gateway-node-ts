/**
 * Record Application Service
 * Orchestrates recording-related use cases
 */

import { injectable } from 'tsyringe';
import {
  StartRecordingUseCase,
  StopRecordingUseCase,
  GetRecordingUseCase,
  ListRecordingsUseCase,
} from '../use-cases/record/index.js';
import {
  StartRecordingDto,
  StopRecordingDto,
  GetRecordingDto,
  ListRecordingsDto,
  StartRecordingResponseDto,
  RecordingResponseDto,
  ListRecordingsResponseDto,
} from '../dtos/index.js';
import { Result } from '@shared/types/index.js';
import { AppError } from '@shared/errors/index.js';

/**
 * Record Service
 * High-level service for recording operations
 */
@injectable()
export class RecordService {
  constructor(
    private startRecordingUseCase: StartRecordingUseCase,
    private stopRecordingUseCase: StopRecordingUseCase,
    private getRecordingUseCase: GetRecordingUseCase,
    private listRecordingsUseCase: ListRecordingsUseCase
  ) {}

  /**
   * Start a recording
   */
  async startRecording(dto: StartRecordingDto): Promise<Result<StartRecordingResponseDto, AppError>> {
    return this.startRecordingUseCase.execute(dto);
  }

  /**
   * Stop a recording
   */
  async stopRecording(dto: StopRecordingDto): Promise<Result<void, AppError>> {
    return this.stopRecordingUseCase.execute(dto);
  }

  /**
   * Get recording details
   */
  async getRecording(dto: GetRecordingDto): Promise<Result<RecordingResponseDto, AppError>> {
    return this.getRecordingUseCase.execute(dto);
  }

  /**
   * List recordings for a room
   */
  async listRecordings(dto: ListRecordingsDto): Promise<Result<ListRecordingsResponseDto, AppError>> {
    return this.listRecordingsUseCase.execute(dto);
  }
}
