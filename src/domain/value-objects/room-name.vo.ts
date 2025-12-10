/**
 * RoomName Value Object
 * Represents a valid room name (6-character alphanumeric)
 */

import { Result, success, failure } from '@shared/types/index.js';
import { ValidationError } from '@shared/errors/index.js';
import { generateId } from '@shared/utils/index.js';

export class RoomName {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  /**
   * Create a new RoomName
   * @param value - Optional custom value, otherwise generates a new 6-char name
   */
  static create(value?: string): Result<RoomName, ValidationError> {
    const name = value ?? generateId(6, 'alphabetic');

    if (!RoomName.isValid(name)) {
      return failure(
        new ValidationError('Invalid RoomName format', {
          value: name,
          expectedLength: '1-50 characters',
          expectedPattern: 'alphanumeric',
        })
      );
    }

    return success(new RoomName(name));
  }

  private static isValid(value: string): boolean {
    return (
      typeof value === 'string' &&
      value.length >= 1 &&
      value.length <= 50 &&
      /^[a-zA-Z0-9]+$/.test(value)
    );
  }

  equals(other: RoomName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}
