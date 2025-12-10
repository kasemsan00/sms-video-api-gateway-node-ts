/**
 * Link Entity
 * Represents an invitation link to join a room
 */

import { Result, success, failure } from '@shared/types/index.js';
import { DomainError } from '@shared/errors/index.js';
import { LinkType, UserType, ErrorCode } from '@shared/constants/index.js';
import { generateId } from '@shared/utils/index.js';

interface LinkProps {
  linkId: string;
  room: string;
  mobile?: string;
  userType: UserType;
  linkType: LinkType;
  userName?: string;
  isAdmin: boolean;
  requireJoinPermission: boolean;
  requireUserName: boolean;
  password?: string;
  oneTimeLink: boolean;
  isUsed: boolean;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
}

interface CreateLinkProps {
  room: string;
  mobile?: string;
  userType?: UserType;
  linkType?: LinkType;
  userName?: string;
  isAdmin?: boolean;
  requireJoinPermission?: boolean;
  requireUserName?: boolean;
  password?: string;
  oneTimeLink?: boolean;
  expiresAt?: Date;
}

export class Link {
  private constructor(private props: LinkProps) {}

  // Getters
  get linkId(): string {
    return this.props.linkId;
  }

  get room(): string {
    return this.props.room;
  }

  get mobile(): string | undefined {
    return this.props.mobile;
  }

  get userType(): UserType {
    return this.props.userType;
  }

  get linkType(): LinkType {
    return this.props.linkType;
  }

  get userName(): string | undefined {
    return this.props.userName;
  }

  get isAdmin(): boolean {
    return this.props.isAdmin;
  }

  get requireJoinPermission(): boolean {
    return this.props.requireJoinPermission;
  }

  get requireUserName(): boolean {
    return this.props.requireUserName;
  }

  get password(): string | undefined {
    return this.props.password;
  }

  get oneTimeLink(): boolean {
    return this.props.oneTimeLink;
  }

  get isUsed(): boolean {
    return this.props.isUsed;
  }

  get latitude(): number | undefined {
    return this.props.latitude;
  }

  get longitude(): number | undefined {
    return this.props.longitude;
  }

  get accuracy(): number | undefined {
    return this.props.accuracy;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  /**
   * Factory method to create a new Link
   */
  static create(props: CreateLinkProps): Result<Link, DomainError> {
    const now = new Date();

    const link = new Link({
      linkId: generateId(6, 'alphanumeric'),
      room: props.room,
      mobile: props.mobile,
      userType: props.userType ?? UserType.USER,
      linkType: props.linkType ?? LinkType.VIDEO,
      userName: props.userName,
      isAdmin: props.isAdmin ?? false,
      requireJoinPermission: props.requireJoinPermission ?? false,
      requireUserName: props.requireUserName ?? false,
      password: props.password,
      oneTimeLink: props.oneTimeLink ?? false,
      isUsed: false,
      createdAt: now,
      updatedAt: now,
      expiresAt: props.expiresAt,
    });

    return success(link);
  }

  /**
   * Reconstitute Link from database
   */
  static fromPersistence(data: LinkProps): Link {
    return new Link(data);
  }

  /**
   * Check if link is expired
   */
  isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false;
    }
    return new Date() > this.props.expiresAt;
  }

  /**
   * Check if link can be used
   */
  canBeUsed(): Result<void, DomainError> {
    if (this.isExpired()) {
      return failure(new DomainError(ErrorCode.LINK_EXPIRED, 'Link has expired'));
    }

    if (this.props.oneTimeLink && this.props.isUsed) {
      return failure(
        new DomainError(ErrorCode.ONE_TIME_LINK_USED, 'One-time link already used')
      );
    }

    return success(undefined);
  }

  /**
   * Mark link as used
   */
  markAsUsed(): Result<void, DomainError> {
    const canUseResult = this.canBeUsed();
    if (canUseResult.isFailure) {
      return canUseResult;
    }

    if (this.props.oneTimeLink) {
      this.props.isUsed = true;
      this.props.updatedAt = new Date();
    }

    return success(undefined);
  }

  /**
   * Update location
   */
  updateLocation(
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Result<void, DomainError> {
    if (latitude < -90 || latitude > 90) {
      return failure(
        new DomainError(ErrorCode.INVALID_LATITUDE, 'Latitude must be between -90 and 90')
      );
    }

    if (longitude < -180 || longitude > 180) {
      return failure(
        new DomainError(ErrorCode.INVALID_LONGITUDE, 'Longitude must be between -180 and 180')
      );
    }

    this.props.latitude = latitude;
    this.props.longitude = longitude;
    this.props.accuracy = accuracy;
    this.props.updatedAt = new Date();

    return success(undefined);
  }

  /**
   * Verify password
   */
  verifyPassword(password: string): boolean {
    if (!this.props.password) {
      return true; // No password required
    }
    return this.props.password === password;
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Record<string, unknown> {
    return {
      linkId: this.props.linkId,
      room: this.props.room,
      mobile: this.props.mobile ?? '',
      userType: this.props.userType,
      linkType: this.props.linkType,
      userName: this.props.userName ?? '',
      isAdmin: this.props.isAdmin ? 1 : 0,
      requireJoinPermission: this.props.requireJoinPermission ? 1 : 0,
      requireUserName: this.props.requireUserName ? 1 : 0,
      password: this.props.password ?? '',
      oneTimeLink: this.props.oneTimeLink ? 1 : 0,
      isUsed: this.props.isUsed ? 1 : 0,
      latitude: this.props.latitude,
      longitude: this.props.longitude,
      accuracy: this.props.accuracy,
      dtmCreated: this.props.createdAt,
      dtmUpdated: this.props.updatedAt,
      dtmExpired: this.props.expiresAt,
    };
  }
}
