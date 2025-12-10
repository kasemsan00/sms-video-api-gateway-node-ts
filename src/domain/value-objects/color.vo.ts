/**
 * Color Value Object
 * Represents a valid hex color code
 */

import { Result, success, failure } from '@shared/types/index.js';
import { ValidationError } from '@shared/errors/index.js';

export class Color {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  /**
   * Create a new Color
   * @param value - Hex color code (with or without #)
   */
  static create(value: string): Result<Color, ValidationError> {
    const normalized = Color.normalize(value);

    if (!Color.isValid(normalized)) {
      return failure(
        new ValidationError('Invalid color format', {
          value,
          expectedFormat: '#RRGGBB or #RGB',
        })
      );
    }

    return success(new Color(normalized));
  }

  /**
   * Normalize color by ensuring it starts with # and is uppercase
   */
  private static normalize(value: string): string {
    let normalized = value.trim();
    if (!normalized.startsWith('#')) {
      normalized = `#${normalized}`;
    }
    return normalized.toUpperCase();
  }

  private static isValid(value: string): boolean {
    return /^#([A-F0-9]{6}|[A-F0-9]{3})$/.test(value);
  }

  /**
   * Convert 3-digit hex to 6-digit hex
   */
  toFullHex(): string {
    if (this._value.length === 4) {
      const r = this._value[1];
      const g = this._value[2];
      const b = this._value[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return this._value;
  }

  /**
   * Get RGB values
   */
  toRGB(): { r: number; g: number; b: number } {
    const hex = this.toFullHex();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  equals(other: Color): boolean {
    return this.toFullHex() === other.toFullHex();
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}
