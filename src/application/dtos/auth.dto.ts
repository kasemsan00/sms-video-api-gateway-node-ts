/**
 * Auth DTOs with Zod validation schemas
 */

import { z } from 'zod';

/**
 * Create JWT Token DTO
 */
export const CreateTokenDtoSchema = z.object({
  identity: z.string().min(1),
  room: z.string().min(1),
  name: z.string().min(1).max(100),
  isAdmin: z.boolean().optional().default(false),
  expiresIn: z.string().optional().default('24h'), // e.g., '1h', '24h', '7d'
});

export type CreateTokenDto = z.infer<typeof CreateTokenDtoSchema>;

/**
 * Verify JWT Token DTO
 */
export const VerifyTokenDtoSchema = z.object({
  token: z.string().min(1),
});

export type VerifyTokenDto = z.infer<typeof VerifyTokenDtoSchema>;

/**
 * Refresh Token DTO
 */
export const RefreshTokenDtoSchema = z.object({
  token: z.string().min(1),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;

/**
 * Token Payload
 */
export interface TokenPayload {
  identity: string;
  room: string;
  name: string;
  isAdmin: boolean;
  iat: number; // Issued at
  exp: number; // Expires at
}

/**
 * Create Token Response DTO
 */
export interface CreateTokenResponseDto {
  token: string;
  expiresAt: Date;
  payload: TokenPayload;
}

/**
 * Verify Token Response DTO
 */
export interface VerifyTokenResponseDto {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}
