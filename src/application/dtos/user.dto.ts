/**
 * User DTOs with Zod validation schemas
 */

import { z } from 'zod';
import { UserType } from '@shared/constants/index.js';

/**
 * Create User DTO
 */
export const CreateUserDtoSchema = z.object({
  room: z.string().min(1),
  identity: z.string().min(1),
  name: z.string().min(1).max(100),
  userType: z.nativeEnum(UserType).optional(),
  mobile: z.string().regex(/^0\d{9}$/).optional(),
  metadata: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isAdmin: z.boolean().optional(),
  isMobile: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

/**
 * Update User DTO
 */
export const UpdateUserDtoSchema = z.object({
  identity: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  metadata: z.string().optional(),
  isOnline: z.boolean().optional(),
  isJoin: z.boolean().optional(),
  isSpeaker: z.boolean().optional(),
  isShareScreen: z.boolean().optional(),
  isShareVideo: z.boolean().optional(),
  isShareAudio: z.boolean().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;

/**
 * Join Room DTO
 */
export const JoinRoomDtoSchema = z.object({
  room: z.string().min(1),
  identity: z.string().min(1),
  name: z.string().min(1).max(100),
  userType: z.nativeEnum(UserType).optional(),
  metadata: z.string().optional(),
});

export type JoinRoomDto = z.infer<typeof JoinRoomDtoSchema>;

/**
 * Leave Room DTO
 */
export const LeaveRoomDtoSchema = z.object({
  room: z.string().min(1),
  identity: z.string().min(1),
});

export type LeaveRoomDto = z.infer<typeof LeaveRoomDtoSchema>;

/**
 * Generate Token DTO
 */
export const GenerateTokenDtoSchema = z.object({
  room: z.string().min(1),
  identity: z.string().min(1),
  name: z.string().min(1).max(100),
  metadata: z.string().optional(),
  canPublish: z.boolean().optional(),
  canSubscribe: z.boolean().optional(),
  canPublishData: z.boolean().optional(),
});

export type GenerateTokenDto = z.infer<typeof GenerateTokenDtoSchema>;

/**
 * Get User DTO
 */
export const GetUserDtoSchema = z.object({
  identity: z.string().min(1),
});

export type GetUserDto = z.infer<typeof GetUserDtoSchema>;

/**
 * List Users DTO
 */
export const ListUsersDtoSchema = z.object({
  room: z.string().min(1),
  onlineOnly: z.boolean().optional().default(false),
});

export type ListUsersDto = z.infer<typeof ListUsersDtoSchema>;

/**
 * User Response DTO
 */
export interface UserResponseDto {
  id: number;
  room: string;
  identity: string;
  name: string;
  userType: UserType;
  mobile?: string;
  metadata?: string;
  color?: string;
  isAdmin: boolean;
  isJoin: boolean;
  isOnline: boolean;
  isSpeaker: boolean;
  isShareScreen: boolean;
  isShareVideo: boolean;
  isShareAudio: boolean;
  isMobile: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate Token Response DTO
 */
export interface GenerateTokenResponseDto {
  token: string;
  identity: string;
  room: string;
}
