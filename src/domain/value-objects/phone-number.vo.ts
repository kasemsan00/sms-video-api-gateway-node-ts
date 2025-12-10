/**
 * PhoneNumber Value Object
 * Represents a valid Thai phone number (10 digits)
 */

import { Result, success, failure } from '@shared/types/index.js';
import { ValidationError } from '@shared/errors/index.js';

export class PhoneNumber {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  /**
   * Create a new PhoneNumber
   * @param value - Phone number string (10 digits)
   */
  static create(value: string): Result<PhoneNumber, ValidationError> {
    const normalized = PhoneNumber.normalize(value);

    if (!PhoneNumber.isValid(normalized)) {
      return failure(
        new ValidationError('Invalid phone number format', {
          value,
          expectedFormat: '10 digits (0-9)',
        })
      );
    }

    return success(new PhoneNumber(normalized));
  }

  /**
   * Normalize phone number by removing non-digit characters
   */
  private static normalize(value: string): string {
    return value.replace(/\D/g, '');
  }

  private static isValid(value: string): boolean {
    return typeof value === 'string' && /^[0-9]{10}$/.test(value);
  }

  /**
   * Format phone number as XXX-XXX-XXXX
   */
  format(): string {
    return `${this._value.slice(0, 3)}-${this._value.slice(3, 6)}-${this._value.slice(6)}`;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}
