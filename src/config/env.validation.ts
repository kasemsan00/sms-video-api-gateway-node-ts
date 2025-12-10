/**
 * Environment variable validation using Zod
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

/**
 * Environment schema definition
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  PORT: z.string().default('5500').transform(Number),
  API_URL: z.string().url().optional(),

  // MySQL Database
  MYSQL_HOST: z.string().min(1),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string(),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_PORT: z.string().default('3306').transform(Number),

  // LiveKit
  LIVEKIT_HOST: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),

  // JWT
  SECRET_KEY: z.string().min(32).optional(),

  // Room settings
  ROOM_DAY_DEFAULT_TIMEOUT: z.string().default('7').transform(Number),
  AUTO_CLOSE_ROOM: z.string().default('true').transform((val) => val === 'true'),
  JOIN_ROOM_REPEAT_DELAY: z.string().default('5000').transform(Number),

  // File upload
  FILE_SIZE_LIMIT: z.string().optional().transform((val) => val ? Number(val) : undefined),

  // SMS
  SMS_ENABLE: z.string().default('false').transform((val) => val === 'true'),
  SMS_API_URL: z.string().url().optional(),

  // Recording
  EGRESS_LIMIT: z.string().default('10').transform(Number),

  // Custom charset for link generation
  CUSTOM_CHARSET: z.string().optional(),

  // External services
  IPPBX_API_URL: z.string().url().optional(),
  RADIO_LOCATION_API_URL: z.string().url().optional(),
  ENCODE_API: z.string().url().optional(),
  REALTIME_SERVICE_URL: z.string().url().optional().default('http://localhost:3002'),
  NOTIFICATION_SERVICE_URL: z.string().url().optional(),
});

/**
 * Validated environment variables type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 *
 * @returns Validated environment variables
 */
export const validateEnv = (): Env => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        return `${err.path.join('.')}: ${err.message}`;
      });

      console.error('❌ Environment validation failed:');
      console.error(missingVars.join('\n'));

      throw new Error('Invalid environment variables');
    }
    throw error;
  }
};

/**
 * Get validated environment variables
 * Cached after first call
 */
let cachedEnv: Env | null = null;

export const getEnv = (): Env => {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
};
