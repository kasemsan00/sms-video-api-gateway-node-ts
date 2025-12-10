/**
 * Common type definitions used throughout the application
 */

// Primitive type aliases for semantic clarity
export type UUID = string;
export type DateTimeString = string; // ISO 8601 format
export type Timestamp = number; // Unix timestamp in milliseconds

// Utility types for nullable and optional values
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Brand types for type safety - prevents mixing different ID types
declare const brand: unique symbol;
type Brand<T, TBrand> = T & { readonly [brand]: TBrand };

export type RoomId = Brand<string, 'RoomId'>;
export type UserId = Brand<string, 'UserId'>;
export type LinkId = Brand<string, 'LinkId'>;
export type MessageId = Brand<number, 'MessageId'>;
export type ServiceId = Brand<number, 'ServiceId'>;
export type CaseId = Brand<number, 'CaseId'>;

// Generic record type for key-value pairs
export type Dictionary<T = unknown> = Record<string, T>;

// Function types
export type AsyncFunction<TResult = void> = () => Promise<TResult>;
export type Callback<TResult = void> = (result: TResult) => void;
export type ErrorCallback = (error: Error) => void;

// Utility function for creating branded types
export const createBrand = <T, TBrand>(value: T): Brand<T, TBrand> => {
  return value as Brand<T, TBrand>;
};
