/**
 * Room status constants
 */

export enum RoomStatus {
  OPEN = 'open',
  CLOSE = 'close',
}

export const ROOM_STATUS_VALUES = Object.values(RoomStatus) as string[];

/**
 * Check if a value is a valid RoomStatus
 */
export const isValidRoomStatus = (value: unknown): value is RoomStatus => {
  return typeof value === 'string' && ROOM_STATUS_VALUES.includes(value);
};
