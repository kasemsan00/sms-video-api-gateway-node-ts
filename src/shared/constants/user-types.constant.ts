/**
 * User type constants
 */

export enum UserType {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

export const USER_TYPE_VALUES = Object.values(UserType) as string[];

/**
 * Check if a value is a valid UserType
 */
export const isValidUserType = (value: unknown): value is UserType => {
  return typeof value === 'string' && USER_TYPE_VALUES.includes(value);
};
