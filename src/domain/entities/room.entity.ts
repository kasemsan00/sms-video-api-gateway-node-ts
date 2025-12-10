/**
 * Room Entity (Aggregate Root)
 * Represents a video conference room with all its business rules
 */

import { Result, success, failure } from '@shared/types/index.js';
import { DomainError } from '@shared/errors/index.js';
import { RoomStatus, RoomType, ErrorCode } from '@shared/constants/index.js';
import { generateId } from '@shared/utils/index.js';

interface RoomProps {
  id?: number;
  name?: string;
  status?: RoomStatus;
  roomType?: RoomType;
  service?: number;
  autoRecord?: boolean;
  chatEnabled?: boolean;
  recordId?: string;
  messageUnread?: number;
  webSocketURL?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
}

interface CreateRoomProps {
  name?: string;
  service?: number;
  linkType?: string;
  autoRecord?: boolean;
  chatEnabled?: boolean;
  webSocketURL?: string;
  userAgent?: string;
}

export class Room {
  private constructor(private props: RoomProps) {}

  // Getters
  get id(): number {
    return this.props.id!;
  }

  get name(): string {
    return this.props.name!;
  }

  get status(): RoomStatus {
    return this.props.status!;
  }

  get roomType(): RoomType {
    return this.props.roomType!;
  }

  get service(): number {
    return this.props.service!;
  }

  get autoRecord(): boolean {
    return this.props.autoRecord!;
  }

  get chatEnabled(): boolean {
    return this.props.chatEnabled!;
  }

  get recordId(): string | undefined {
    return this.props.recordId;
  }

  get messageUnread(): number {
    return this.props.messageUnread ?? 0;
  }

  get webSocketURL(): string | undefined {
    return this.props.webSocketURL;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get expiresAt(): Date {
    return this.props.expiresAt!;
  }

  /**
   * Factory method to create a new Room
   */
  static create(props: CreateRoomProps): Result<Room, DomainError> {
    const defaultTimeout = parseInt(
      process.env.ROOM_DAY_DEFAULT_TIMEOUT || '7'
    );
    const now = new Date();

    const status =
      props.linkType === 'location' ? RoomStatus.CLOSE : RoomStatus.OPEN;
    const roomType =
      props.linkType === 'location' ? RoomType.LOCATION : RoomType.CONFERENCE;

    const room = new Room({
      id: undefined, // Will be set by database
      name: props.name ?? generateId(6, 'alphabetic'),
      status,
      roomType,
      service: props.service ?? 999,
      autoRecord: props.autoRecord ?? true,
      chatEnabled: props.chatEnabled ?? true,
      webSocketURL: props.webSocketURL ?? '',
      userAgent: props.userAgent ?? '',
      messageUnread: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(
        now.getTime() + defaultTimeout * 24 * 60 * 60 * 1000
      ),
    });

    return success(room);
  }

  /**
   * Reconstitute Room from database
   */
  static fromPersistence(data: RoomProps): Room {
    return new Room(data);
  }

  /**
   * Close the room
   */
  close(): Result<void, DomainError> {
    if (this.props.status === RoomStatus.CLOSE) {
      return failure(
        new DomainError(ErrorCode.ROOM_ALREADY_CLOSED, 'Room is already closed')
      );
    }

    this.props.status = RoomStatus.CLOSE;
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  /**
   * Reopen the room
   */
  reopen(): Result<void, DomainError> {
    if (this.isExpired()) {
      return failure(
        new DomainError(ErrorCode.ROOM_EXPIRED, 'Cannot reopen expired room')
      );
    }

    this.props.status = RoomStatus.OPEN;
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  /**
   * Check if room is expired
   */
  isExpired(): boolean {
    return new Date() > this.props.expiresAt!;
  }

  /**
   * Check if room is open
   */
  isOpen(): boolean {
    return this.props.status === RoomStatus.OPEN;
  }

  /**
   * Check if room is closed
   */
  isClosed(): boolean {
    return this.props.status === RoomStatus.CLOSE;
  }

  /**
   * Mark message as unread
   */
  markMessageAsUnread(): void {
    this.props.messageUnread = 1;
    this.props.updatedAt = new Date();
  }

  /**
   * Clear unread messages
   */
  clearUnreadMessages(): void {
    this.props.messageUnread = 0;
    this.props.updatedAt = new Date();
  }

  /**
   * Set recording ID
   */
  setRecordId(recordId: string): void {
    this.props.recordId = recordId;
    this.props.updatedAt = new Date();
  }

  /**
   * Extend expiry date
   */
  extendExpiry(days: number): Result<void, DomainError> {
    if (days <= 0) {
      return failure(
        new DomainError(ErrorCode.INVALID_DAYS, 'Days must be positive')
      );
    }

    this.props.expiresAt = new Date(
      this.props.expiresAt!.getTime() + days * 24 * 60 * 60 * 1000
    );
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.props.id,
      room: this.props.name,
      status: this.props.status,
      roomType: this.props.roomType,
      service: this.props.service,
      autoRecord: this.props.autoRecord ? 1 : 0,
      chatEnabled: this.props.chatEnabled ? 1 : 0,
      recordId: this.props.recordId ?? '',
      messageUnread: this.props.messageUnread,
      webSocketURL: this.props.webSocketURL,
      userAgent: this.props.userAgent,
      dtmCreated: this.props.createdAt,
      dtmUpdated: this.props.updatedAt,
      dtmExpired: this.props.expiresAt,
    };
  }
}
