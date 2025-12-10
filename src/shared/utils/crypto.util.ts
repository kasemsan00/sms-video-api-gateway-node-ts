/**
 * Cryptography utilities
 * Hashing and encryption helpers
 */

import crypto from 'crypto';

/**
 * Hash a string using MD5
 * Note: MD5 is not secure for passwords in production!
 * This is kept for backward compatibility with existing system
 *
 * @param data - Data to hash
 * @returns MD5 hash
 *
 * @example
 * ```typescript
 * const hash = md5Hash('password123');
 * ```
 *
 * @deprecated Use bcrypt or argon2 for password hashing in production
 */
export const md5Hash = (data: string): string => {
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Hash a string using SHA256
 *
 * @param data - Data to hash
 * @returns SHA256 hash
 *
 * @example
 * ```typescript
 * const hash = sha256Hash('sensitive-data');
 * ```
 */
export const sha256Hash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a random token
 *
 * @param length - Length in bytes (default: 32)
 * @returns Random token in hex format
 *
 * @example
 * ```typescript
 * const token = generateRandomToken(); // 64 character hex string
 * const shortToken = generateRandomToken(16); // 32 character hex string
 * ```
 */
export const generateRandomToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a random number between min and max (inclusive)
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number
 *
 * @example
 * ```typescript
 * const random = randomInt(1, 100); // Random number between 1 and 100
 * ```
 */
export const randomInt = (min: number, max: number): number => {
  return crypto.randomInt(min, max + 1);
};

/**
 * Compare two strings in constant time to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if equal
 *
 * @example
 * ```typescript
 * const isEqual = constantTimeCompare(hash1, hash2);
 * ```
 */
export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return crypto.timingSafeEqual(bufferA, bufferB);
};

/**
 * Verify MD5 hash
 *
 * @param data - Original data
 * @param hash - Hash to compare against
 * @returns True if hash matches
 *
 * @example
 * ```typescript
 * const isValid = verifyMd5Hash('password123', storedHash);
 * ```
 */
export const verifyMd5Hash = (data: string, hash: string): boolean => {
  const computed = md5Hash(data);
  return constantTimeCompare(computed, hash);
};
