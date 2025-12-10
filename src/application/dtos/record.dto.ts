/**
 * Record DTOs with Zod validation schemas
 */

import { z } from 'zod';

/**
 * Start Recording DTO
 */
export const StartRecordingDtoSchema = z.object({
  room: z.string().min(1),
  filePrefix: z.string().optional(),
  preset: z.enum(['H264_720P_30', 'H264_1080P_30', 'H264_720P_60', 'H264_1080P_60']).optional(),
});

export type StartRecordingDto = z.infer<typeof StartRecordingDtoSchema>;

/**
 * Stop Recording DTO
 */
export const StopRecordingDtoSchema = z.object({
  room: z.string().min(1),
  egressId: z.string().min(1),
});

export type StopRecordingDto = z.infer<typeof StopRecordingDtoSchema>;

/**
 * Get Recording DTO
 */
export const GetRecordingDtoSchema = z.object({
  egressId: z.string().min(1),
});

export type GetRecordingDto = z.infer<typeof GetRecordingDtoSchema>;

/**
 * List Recordings DTO
 */
export const ListRecordingsDtoSchema = z.object({
  room: z.string().min(1),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type ListRecordingsDto = z.infer<typeof ListRecordingsDtoSchema>;

/**
 * Recording Status
 */
export enum RecordingStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Recording Response DTO
 */
export interface RecordingResponseDto {
  id: number;
  egressId: string;
  room: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  duration?: number;
  status: RecordingStatus;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Start Recording Response DTO
 */
export interface StartRecordingResponseDto {
  egressId: string;
  room: string;
  status: RecordingStatus;
  startedAt: Date;
}

/**
 * List Recordings Response DTO
 */
export interface ListRecordingsResponseDto {
  items: RecordingResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
