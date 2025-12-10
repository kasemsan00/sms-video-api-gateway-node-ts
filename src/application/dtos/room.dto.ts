/**
 * Room DTOs with Zod validation schemas
 */

import { z } from 'zod';
import { RoomStatus, RoomType } from '@shared/constants/index.js';

/**
 * Create Room DTO
 */
export const CreateRoomDtoSchema = z.object({
  name: z.string().optional(),
  service: z.number().int().positive().optional(),
  linkType: z.enum(['video', 'location']).optional(),
  autoRecord: z.boolean().optional(),
  chatEnabled: z.boolean().optional(),
  webSocketURL: z.string().url().optional(),
  userAgent: z.string().optional(),
});

export type CreateRoomDto = z.infer<typeof CreateRoomDtoSchema>;

/**
 * Update Room DTO
 */
export const UpdateRoomDtoSchema = z.object({
  id: z.number().int().positive(),
  autoRecord: z.boolean().optional(),
  chatEnabled: z.boolean().optional(),
  messageUnread: z.number().int().min(0).optional(),
});

export type UpdateRoomDto = z.infer<typeof UpdateRoomDtoSchema>;

/**
 * Close Room DTO
 */
export const CloseRoomDtoSchema = z.object({
  roomName: z.string().min(1),
});

export type CloseRoomDto = z.infer<typeof CloseRoomDtoSchema>;

/**
 * Reopen Room DTO
 */
export const ReopenRoomDtoSchema = z.object({
  roomName: z.string().min(1),
});

export type ReopenRoomDto = z.infer<typeof ReopenRoomDtoSchema>;

/**
 * Get Room DTO
 */
export const GetRoomDtoSchema = z.object({
  roomName: z.string().min(1),
});

export type GetRoomDto = z.infer<typeof GetRoomDtoSchema>;

/**
 * Extend Room Expiry DTO
 */
export const ExtendRoomExpiryDtoSchema = z.object({
  roomName: z.string().min(1),
  days: z.number().int().positive().max(365),
});

export type ExtendRoomExpiryDto = z.infer<typeof ExtendRoomExpiryDtoSchema>;

/**
 * List Rooms DTO
 */
export const ListRoomsDtoSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  status: z.nativeEnum(RoomStatus).optional(),
});

export type ListRoomsDto = z.infer<typeof ListRoomsDtoSchema>;

/**
 * Room Response DTO
 */
export interface RoomResponseDto {
  id: number;
  name: string;
  status: RoomStatus;
  roomType: RoomType;
  service: number;
  autoRecord: boolean;
  chatEnabled: boolean;
  recordId?: string;
  messageUnread: number;
  webSocketURL?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

/**
 * List Rooms Response DTO
 */
export interface ListRoomsResponseDto {
  items: RoomResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
