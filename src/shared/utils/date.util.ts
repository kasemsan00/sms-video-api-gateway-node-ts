/**
 * Date utilities
 * Wrappers around dayjs for consistent date handling
 */

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Default timezone (Asia/Bangkok)
 */
export const DEFAULT_TIMEZONE = 'Asia/Bangkok';

/**
 * Common date formats
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  DISPLAY: 'DD/MM/YYYY HH:mm',
} as const;

/**
 * Get current date/time
 *
 * @param timezone - Timezone to use (default: Asia/Bangkok)
 * @returns Dayjs instance
 *
 * @example
 * ```typescript
 * const now = now(); // Current time in Bangkok
 * const utcNow = now('UTC'); // Current time in UTC
 * ```
 */
export const now = (timezone: string = DEFAULT_TIMEZONE): Dayjs => {
  return dayjs().tz(timezone);
};

/**
 * Format date to string
 *
 * @param date - Date to format
 * @param format - Format string (default: DATETIME)
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * const formatted = formatDate(new Date()); // "2024-01-15 10:30:00"
 * const iso = formatDate(new Date(), DATE_FORMATS.ISO); // "2024-01-15T10:30:00.000+07:00"
 * ```
 */
export const formatDate = (
  date: Date | string | Dayjs,
  format: string = DATE_FORMATS.DATETIME
): string => {
  return dayjs(date).format(format);
};

/**
 * Parse date string to Date object
 *
 * @param dateString - Date string to parse
 * @param format - Format of the input string (optional)
 * @returns Date object
 *
 * @example
 * ```typescript
 * const date = parseDate('2024-01-15 10:30:00');
 * ```
 */
export const parseDate = (
  dateString: string,
  format?: string
): Date => {
  return format
    ? dayjs(dateString, format).toDate()
    : dayjs(dateString).toDate();
};

/**
 * Add duration to date
 *
 * @param date - Base date
 * @param amount - Amount to add
 * @param unit - Unit of time
 * @returns New date
 *
 * @example
 * ```typescript
 * const futureDate = addDuration(new Date(), 7, 'day'); // 7 days from now
 * const futureHour = addDuration(new Date(), 2, 'hour'); // 2 hours from now
 * ```
 */
export const addDuration = (
  date: Date | string | Dayjs,
  amount: number,
  unit: dayjs.ManipulateType
): Date => {
  return dayjs(date).add(amount, unit).toDate();
};

/**
 * Subtract duration from date
 *
 * @param date - Base date
 * @param amount - Amount to subtract
 * @param unit - Unit of time
 * @returns New date
 *
 * @example
 * ```typescript
 * const pastDate = subtractDuration(new Date(), 7, 'day'); // 7 days ago
 * ```
 */
export const subtractDuration = (
  date: Date | string | Dayjs,
  amount: number,
  unit: dayjs.ManipulateType
): Date => {
  return dayjs(date).subtract(amount, unit).toDate();
};

/**
 * Check if date is expired (before now)
 *
 * @param expiryDate - Date to check
 * @returns True if expired
 *
 * @example
 * ```typescript
 * const isExpired = isDateExpired(room.expiresAt);
 * ```
 */
export const isDateExpired = (expiryDate: Date | string): boolean => {
  return dayjs(expiryDate).isBefore(dayjs());
};

/**
 * Check if date is in the future
 *
 * @param date - Date to check
 * @returns True if in future
 *
 * @example
 * ```typescript
 * const isFuture = isDateInFuture(room.expiresAt);
 * ```
 */
export const isDateInFuture = (date: Date | string): boolean => {
  return dayjs(date).isAfter(dayjs());
};

/**
 * Get difference between two dates
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @param unit - Unit to return (default: 'millisecond')
 * @returns Difference in specified unit
 *
 * @example
 * ```typescript
 * const diffInDays = getDateDifference(futureDate, now(), 'day');
 * const diffInHours = getDateDifference(futureDate, now(), 'hour');
 * ```
 */
export const getDateDifference = (
  date1: Date | string | Dayjs,
  date2: Date | string | Dayjs,
  unit: dayjs.QUnitType | dayjs.OpUnitType = 'millisecond'
): number => {
  return dayjs(date1).diff(dayjs(date2), unit);
};

/**
 * Get expiry date (now + days)
 *
 * @param days - Number of days from now
 * @returns Expiry date
 *
 * @example
 * ```typescript
 * const expiresAt = getExpiryDate(7); // 7 days from now
 * ```
 */
export const getExpiryDate = (days: number): Date => {
  return addDuration(new Date(), days, 'day');
};

/**
 * Format date for MySQL DATETIME
 *
 * @param date - Date to format
 * @returns MySQL-compatible datetime string
 *
 * @example
 * ```typescript
 * const mysqlDate = toMySQLDateTime(new Date()); // "2024-01-15 10:30:00"
 * ```
 */
export const toMySQLDateTime = (date: Date | string | Dayjs = new Date()): string => {
  return formatDate(date, DATE_FORMATS.DATETIME);
};

/**
 * Format date for ISO 8601
 *
 * @param date - Date to format
 * @returns ISO 8601 string
 *
 * @example
 * ```typescript
 * const isoDate = toISO(new Date()); // "2024-01-15T10:30:00.000+07:00"
 * ```
 */
export const toISO = (date: Date | string | Dayjs = new Date()): string => {
  return dayjs(date).toISOString();
};
