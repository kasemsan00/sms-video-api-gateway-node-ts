/**
 * Room type constants
 */

export enum RoomType {
  CONFERENCE = 'conference',
  LOCATION = 'location',
}

export const ROOM_TYPE_VALUES = Object.values(RoomType) as string[];

/**
 * Check if a value is a valid RoomType
 */
export const isValidRoomType = (value: unknown): value is RoomType => {
  return typeof value === 'string' && ROOM_TYPE_VALUES.includes(value);
};
