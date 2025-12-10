/**
 * ID generation utilities
 * Wrappers around nanoid and randomstring for consistent ID generation
 */

import { customAlphabet, nanoid as nanoIdDefault } from 'nanoid';
import randomString from 'randomstring';

/**
 * Default character sets for ID generation
 */
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ALPHABETIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const NUMERIC = '0123456789';
const URL_SAFE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$';

/**
 * Generate a unique ID using nanoid
 * Default length is 10 characters with alphanumeric charset
 *
 * @param length - Length of the ID (default: 10)
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Generated ID
 *
 * @example
 * ```typescript
 * const id = generateId(); // "V1StGXR8_Z"
 * const shortId = generateId(6); // "4n6L0p"
 * const alphabeticId = generateId(8, 'alphabetic'); // "aBcDeFgH"
 * ```
 */
export const generateId = (
  length: number = 10,
  charset: 'alphanumeric' | 'alphabetic' | 'numeric' | 'url-safe' = 'alphanumeric'
): string => {
  const charsetMap = {
    alphanumeric: ALPHANUMERIC,
    alphabetic: ALPHABETIC,
    numeric: NUMERIC,
    'url-safe': URL_SAFE,
  };

  const selectedCharset = charsetMap[charset];
  const customNanoid = customAlphabet(selectedCharset, length);

  return customNanoid();
};

/**
 * Generate a room name
 * Uses alphabetic characters only, length 6
 *
 * @returns Generated room name
 *
 * @example
 * ```typescript
 * const roomName = generateRoomName(); // "ABCDEF"
 * ```
 */
export const generateRoomName = (): string => {
  return generateId(6, 'alphabetic');
};

/**
 * Generate a link ID
 * Uses custom charset from environment variable if available
 *
 * @returns Generated link ID
 *
 * @example
 * ```typescript
 * const linkId = generateLinkId(); // "a1B2c3"
 * ```
 */
export const generateLinkId = (): string => {
  const customCharset = process.env.CUSTOM_CHARSET;

  if (customCharset && customCharset.length > 0) {
    return randomString.generate({
      length: 6,
      charset: customCharset,
    });
  }

  return generateId(6, 'url-safe');
};

/**
 * Generate a user identity
 * Uses alphanumeric characters, length 10
 *
 * @returns Generated user identity
 *
 * @example
 * ```typescript
 * const identity = generateUserIdentity(); // "a1b2C3d4E5"
 * ```
 */
export const generateUserIdentity = (): string => {
  return generateId(10, 'alphanumeric');
};

/**
 * Generate a viewer identity (prefixed with "viewer_")
 *
 * @returns Generated viewer identity
 *
 * @example
 * ```typescript
 * const identity = generateViewerIdentity(); // "viewer_a1b2C3d4E5"
 * ```
 */
export const generateViewerIdentity = (): string => {
  return `viewer_${generateId(10, 'alphanumeric')}`;
};

/**
 * Generate a UUID v4
 * Uses nanoid with UUID-compatible charset
 *
 * @returns Generated UUID
 *
 * @example
 * ```typescript
 * const uuid = generateUUID(); // Standard nanoid
 * ```
 */
export const generateUUID = (): string => {
  return nanoIdDefault();
};

/**
 * Generate a guest username
 *
 * @returns Generated guest name
 *
 * @example
 * ```typescript
 * const guestName = generateGuestName(); // "Guest-42"
 * ```
 */
export const generateGuestName = (): string => {
  const randomNum = Math.floor(Math.random() * 100);
  return `Guest-${randomNum}`;
};

/**
 * Generate a random username
 *
 * @returns Generated user name
 *
 * @example
 * ```typescript
 * const userName = generateUserName(); // "User-73"
 * ```
 */
export const generateUserName = (): string => {
  const randomNum = Math.floor(Math.random() * 100);
  return `User-${randomNum}`;
};
