/**
 * Chat DTOs with Zod validation schemas
 */

import { z } from 'zod';

/**
 * Send Message DTO
 */
export const SendMessageDtoSchema = z.object({
  room: z.string().min(1),
  identity: z.string().min(1),
  name: z.string().min(1).max(100),
  message: z.string().min(1).max(2000),
  replyToMessageId: z.number().int().positive().optional(),
});

export type SendMessageDto = z.infer<typeof SendMessageDtoSchema>;

/**
 * Get Message DTO
 */
export const GetMessageDtoSchema = z.object({
  messageId: z.number().int().positive(),
});

export type GetMessageDto = z.infer<typeof GetMessageDtoSchema>;

/**
 * Get Messages DTO
 */
export const GetMessagesDtoSchema = z.object({
  room: z.string().min(1),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(50),
});

export type GetMessagesDto = z.infer<typeof GetMessagesDtoSchema>;

/**
 * Delete Message DTO
 */
export const DeleteMessageDtoSchema = z.object({
  messageId: z.number().int().positive(),
  identity: z.string().min(1), // Only owner can delete
});

export type DeleteMessageDto = z.infer<typeof DeleteMessageDtoSchema>;

/**
 * Mark Room Messages Read DTO
 */
export const MarkMessagesReadDtoSchema = z.object({
  room: z.string().min(1),
});

export type MarkMessagesReadDto = z.infer<typeof MarkMessagesReadDtoSchema>;

/**
 * Message Response DTO
 */
export interface MessageResponseDto {
  id: number;
  room: string;
  identity: string;
  name: string;
  message: string;
  isDeleted: boolean;
  replyTo?: {
    messageId: number;
    userName: string;
    text: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Messages Response DTO
 */
export interface GetMessagesResponseDto {
  items: MessageResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
