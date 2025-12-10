/**
 * LiveKit configuration
 */

import { getEnv } from './env.validation.js';

/**
 * LiveKit service configuration
 */
export interface LivekitConfig {
  host: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Get LiveKit configuration from environment
 */
export const getLivekitConfig = (): LivekitConfig => {
  const env = getEnv();

  return {
    host: env.LIVEKIT_HOST,
    apiKey: env.LIVEKIT_API_KEY,
    apiSecret: env.LIVEKIT_API_SECRET,
  };
};

/**
 * Default room options
 */
export const DEFAULT_ROOM_OPTIONS = {
  emptyTimeout: 10 * 60, // 10 minutes
  maxParticipants: 100,
} as const;

/**
 * Default token grants
 */
export const DEFAULT_TOKEN_GRANTS = {
  roomJoin: true,
  canPublishData: true,
  canPublish: true,
  canSubscribe: true,
  roomList: true,
} as const;
