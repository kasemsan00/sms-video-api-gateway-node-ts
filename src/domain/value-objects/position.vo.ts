/**
 * Position Value Object
 * Represents a GPS coordinate with latitude, longitude, and optional accuracy
 */

import { Result, success, failure } from '@shared/types/index.js';
import { ValidationError } from '@shared/errors/index.js';

export class Position {
  private constructor(
    private readonly _latitude: number,
    private readonly _longitude: number,
    private readonly _accuracy?: number
  ) {}

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  get accuracy(): number | undefined {
    return this._accuracy;
  }

  /**
   * Create a new Position
   * @param latitude - Latitude (-90 to 90)
   * @param longitude - Longitude (-180 to 180)
   * @param accuracy - Optional accuracy in meters
   */
  static create(
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Result<Position, ValidationError> {
    if (!Position.isValidLatitude(latitude)) {
      return failure(
        new ValidationError('Invalid latitude', {
          value: latitude,
          range: '-90 to 90',
        })
      );
    }

    if (!Position.isValidLongitude(longitude)) {
      return failure(
        new ValidationError('Invalid longitude', {
          value: longitude,
          range: '-180 to 180',
        })
      );
    }

    if (accuracy !== undefined && accuracy < 0) {
      return failure(
        new ValidationError('Invalid accuracy', {
          value: accuracy,
          requirement: 'must be non-negative',
        })
      );
    }

    return success(new Position(latitude, longitude, accuracy));
  }

  private static isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  private static isValidLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }

  /**
   * Calculate distance to another position using Haversine formula
   * @param other - Another Position
   * @returns Distance in meters
   */
  distanceTo(other: Position): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (this._latitude * Math.PI) / 180;
    const φ2 = (other._latitude * Math.PI) / 180;
    const Δφ = ((other._latitude - this._latitude) * Math.PI) / 180;
    const Δλ = ((other._longitude - this._longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  equals(other: Position): boolean {
    return (
      this._latitude === other._latitude &&
      this._longitude === other._longitude &&
      this._accuracy === other._accuracy
    );
  }

  toJSON(): { latitude: number; longitude: number; accuracy?: number } {
    return {
      latitude: this._latitude,
      longitude: this._longitude,
      accuracy: this._accuracy,
    };
  }

  toString(): string {
    return `(${this._latitude}, ${this._longitude})`;
  }
}
