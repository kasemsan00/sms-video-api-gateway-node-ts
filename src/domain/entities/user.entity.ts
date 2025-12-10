/**
 * User Entity
 * Represents a participant in a video conference room
 */

import { Result, success, failure } from '@shared/types/index.js';
import { DomainError } from '@shared/errors/index.js';
import { UserType, ErrorCode } from '@shared/constants/index.js';

interface UserProps {
  id?: number;
  room: string;
  identity: string;
  name: string;
  userType: UserType;
  mobile?: string;
  metadata?: string;
  color?: string;
  isAdmin?: boolean;
  isJoin?: boolean;
  isOnline?: boolean;
  isSpeaker?: boolean;
  isShareScreen?: boolean;
  isShareVideo?: boolean;
  isShareAudio?: boolean;
  isMobile?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateUserProps {
  room: string;
  identity: string;
  name: string;
  userType?: UserType;
  mobile?: string;
  metadata?: string;
  color?: string;
  isAdmin?: boolean;
  isMobile?: boolean;
}

export class User {
  private constructor(private props: UserProps) {}

  // Getters
  get id(): number {
    return this.props.id!;
  }

  get room(): string {
    return this.props.room;
  }

  get identity(): string {
    return this.props.identity;
  }

  get name(): string {
    return this.props.name;
  }

  get userType(): UserType {
    return this.props.userType;
  }

  get mobile(): string | undefined {
    return this.props.mobile;
  }

  get metadata(): string | undefined {
    return this.props.metadata;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get isAdmin(): boolean {
    return this.props.isAdmin ?? false;
  }

  get isJoin(): boolean {
    return this.props.isJoin ?? false;
  }

  get isOnline(): boolean {
    return this.props.isOnline ?? false;
  }

  get isSpeaker(): boolean {
    return this.props.isSpeaker ?? false;
  }

  get isShareScreen(): boolean {
    return this.props.isShareScreen ?? false;
  }

  get isShareVideo(): boolean {
    return this.props.isShareVideo ?? false;
  }

  get isShareAudio(): boolean {
    return this.props.isShareAudio ?? false;
  }

  get isMobile(): boolean {
    return this.props.isMobile ?? false;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  /**
   * Factory method to create a new User
   */
  static create(props: CreateUserProps): Result<User, DomainError> {
    const now = new Date();

    const user = new User({
      ...props,
      userType: props.userType ?? UserType.USER,
      isAdmin: props.isAdmin ?? false,
      isJoin: false,
      isOnline: false,
      isSpeaker: false,
      isShareScreen: false,
      isShareVideo: false,
      isShareAudio: false,
      isMobile: props.isMobile ?? false,
      createdAt: now,
      updatedAt: now,
    });

    return success(user);
  }

  /**
   * Reconstitute User from database
   */
  static fromPersistence(data: UserProps): User {
    return new User(data);
  }

  /**
   * Mark user as joined
   */
  join(): void {
    this.props.isJoin = true;
    this.props.isOnline = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark user as left
   */
  leave(): void {
    this.props.isJoin = false;
    this.props.isOnline = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline: boolean): void {
    this.props.isOnline = isOnline;
    this.props.updatedAt = new Date();
  }

  /**
   * Toggle speaker status
   */
  toggleSpeaker(isSpeaker: boolean): void {
    this.props.isSpeaker = isSpeaker;
    this.props.updatedAt = new Date();
  }

  /**
   * Toggle screen sharing
   */
  toggleScreenShare(isSharing: boolean): void {
    this.props.isShareScreen = isSharing;
    this.props.updatedAt = new Date();
  }

  /**
   * Toggle video sharing
   */
  toggleVideoShare(isSharing: boolean): void {
    this.props.isShareVideo = isSharing;
    this.props.updatedAt = new Date();
  }

  /**
   * Toggle audio sharing
   */
  toggleAudioShare(isSharing: boolean): void {
    this.props.isShareAudio = isSharing;
    this.props.updatedAt = new Date();
  }

  /**
   * Update user name
   */
  updateName(name: string): Result<void, DomainError> {
    if (!name || name.trim().length === 0) {
      return failure(new DomainError(ErrorCode.INVALID_NAME, 'Name cannot be empty'));
    }

    this.props.name = name;
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  /**
   * Update user metadata
   */
  updateMetadata(metadata: string): void {
    this.props.metadata = metadata;
    this.props.updatedAt = new Date();
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.props.id,
      room: this.props.room,
      identity: this.props.identity,
      name: this.props.name,
      userType: this.props.userType,
      mobile: this.props.mobile ?? '',
      metadata: this.props.metadata ?? '',
      color: this.props.color ?? '',
      isAdmin: this.props.isAdmin ? 1 : 0,
      isJoin: this.props.isJoin ? 1 : 0,
      isOnline: this.props.isOnline ? 1 : 0,
      isSpeaker: this.props.isSpeaker ? 1 : 0,
      isShareScreen: this.props.isShareScreen ? 1 : 0,
      isShareVideo: this.props.isShareVideo ? 1 : 0,
      isShareAudio: this.props.isShareAudio ? 1 : 0,
      isMobile: this.props.isMobile ? 1 : 0,
      dtmCreated: this.props.createdAt,
      dtmUpdated: this.props.updatedAt,
    };
  }
}
