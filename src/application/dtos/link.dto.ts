/**
 * Link DTOs with Zod validation schemas
 */

import { z } from 'zod';
import { LinkType, UserType } from '@shared/constants/index.js';

/**
 * Create Link DTO
 */
export const CreateLinkDtoSchema = z.object({
  room: z.string().min(1),
  mobile: z.string().regex(/^0\d{9}$/).optional(),
  userType: z.nativeEnum(UserType).optional(),
  linkType: z.nativeEnum(LinkType).optional(),
  userName: z.string().max(100).optional(),
  isAdmin: z.boolean().optional(),
  requireJoinPermission: z.boolean().optional(),
  requireUserName: z.boolean().optional(),
  password: z.string().min(4).max(20).optional(),
  oneTimeLink: z.boolean().optional(),
  expiresInDays: z.number().int().positive().max(365).optional(),
  sendSms: z.boolean().optional().default(false),
});

export type CreateLinkDto = z.infer<typeof CreateLinkDtoSchema>;

/**
 * Get Link DTO
 */
export const GetLinkDtoSchema = z.object({
  linkId: z.string().length(6),
});

export type GetLinkDto = z.infer<typeof GetLinkDtoSchema>;

/**
 * Verify Link DTO
 */
export const VerifyLinkDtoSchema = z.object({
  linkId: z.string().length(6),
  password: z.string().optional(),
});

export type VerifyLinkDto = z.infer<typeof VerifyLinkDtoSchema>;

/**
 * Update Link Location DTO
 */
export const UpdateLinkLocationDtoSchema = z.object({
  linkId: z.string().length(6),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
});

export type UpdateLinkLocationDto = z.infer<typeof UpdateLinkLocationDtoSchema>;

/**
 * List Links DTO
 */
export const ListLinksDtoSchema = z.object({
  room: z.string().min(1),
  linkType: z.nativeEnum(LinkType).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type ListLinksDto = z.infer<typeof ListLinksDtoSchema>;

/**
 * Mark Link Used DTO
 */
export const MarkLinkUsedDtoSchema = z.object({
  linkId: z.string().length(6),
});

export type MarkLinkUsedDto = z.infer<typeof MarkLinkUsedDtoSchema>;

/**
 * Link Response DTO
 */
export interface LinkResponseDto {
  linkId: string;
  room: string;
  mobile?: string;
  userType: UserType;
  linkType: LinkType;
  userName?: string;
  isAdmin: boolean;
  requireJoinPermission: boolean;
  requireUserName: boolean;
  oneTimeLink: boolean;
  isUsed: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  url: string; // Full URL for the link
}

/**
 * Create Link Response DTO
 */
export interface CreateLinkResponseDto extends LinkResponseDto {
  smsSent?: boolean;
  smsMessageId?: string;
}
