/**
 * LinkId Value Object
 * Represents a unique 6-character alphanumeric link identifier
 */

import { Result, success, failure } from '@shared/types/index.js';
import { ValidationError } from '@shared/errors/index.js';
import { generateId } from '@shared/utils/index.js';

export class LinkId {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  /**
   * Create a new LinkId
   * @param value - Optional custom value, otherwise generates a new 6-char ID
   */
  static create(value?: string): Result<LinkId, ValidationError> {
    const id = value ?? generateId(6, 'alphanumeric');

    if (!LinkId.isValid(id)) {
      return failure(
        new ValidationError('Invalid LinkId format', {
          value: id,
          expectedLength: 6,
          expectedPattern: 'alphanumeric',
        })
      );
    }

    return success(new LinkId(id));
  }

  private static isValid(value: string): boolean {
    return (
      typeof value === 'string' &&
      value.length === 6 &&
      /^[a-zA-Z0-9]+$/.test(value)
    );
  }

  equals(other: LinkId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}
