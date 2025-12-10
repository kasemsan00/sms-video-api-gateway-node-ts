/**
 * UserIdentity Value Object
 * Represents a user's identity (name + metadata)
 */

import { Result, success, failure } from '@shared/types/index.js';
import { ValidationError } from '@shared/errors/index.js';

export class UserIdentity {
  private constructor(
    private readonly _name: string,
    private readonly _metadata?: string
  ) {}

  get name(): string {
    return this._name;
  }

  get metadata(): string | undefined {
    return this._metadata;
  }

  /**
   * Create a new UserIdentity
   * @param name - User's display name
   * @param metadata - Optional metadata (JSON string)
   */
  static create(
    name: string,
    metadata?: string
  ): Result<UserIdentity, ValidationError> {
    if (!UserIdentity.isValidName(name)) {
      return failure(
        new ValidationError('Invalid user name', {
          value: name,
          requirement: '1-100 characters',
        })
      );
    }

    if (metadata && !UserIdentity.isValidMetadata(metadata)) {
      return failure(
        new ValidationError('Invalid metadata', {
          value: metadata,
          requirement: 'must be valid JSON string or empty',
        })
      );
    }

    return success(new UserIdentity(name, metadata));
  }

  private static isValidName(name: string): boolean {
    return (
      typeof name === 'string' && name.trim().length >= 1 && name.length <= 100
    );
  }

  private static isValidMetadata(metadata: string): boolean {
    if (metadata.trim() === '') return true;
    try {
      JSON.parse(metadata);
      return true;
    } catch {
      return false;
    }
  }

  equals(other: UserIdentity): boolean {
    return this._name === other._name && this._metadata === other._metadata;
  }

  toString(): string {
    return this._name;
  }

  toJSON(): { name: string; metadata?: string } {
    return {
      name: this._name,
      metadata: this._metadata,
    };
  }
}
