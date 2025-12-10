/**
 * Message Entity
 * Represents a chat message in a room
 */

import { Result, success, failure } from '@shared/types/index.js';
import { DomainError } from '@shared/errors/index.js';
import { ErrorCode } from '@shared/constants/index.js';

interface MessageProps {
  id?: number;
  room: string;
  identity: string;
  name: string;
  message: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateMessageProps {
  room: string;
  identity: string;
  name: string;
  message: string;
}

export class Message {
  private constructor(private props: MessageProps) {}

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

  get message(): string {
    return this.props.message;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  /**
   * Factory method to create a new Message
   */
  static create(props: CreateMessageProps): Result<Message, DomainError> {
    if (!props.message || props.message.trim().length === 0) {
      return failure(
        new DomainError(ErrorCode.EMPTY_MESSAGE, 'Message cannot be empty')
      );
    }

    if (props.message.length > 5000) {
      return failure(
        new DomainError(
          ErrorCode.MESSAGE_TOO_LONG,
          'Message cannot exceed 5000 characters'
        )
      );
    }

    const now = new Date();

    const message = new Message({
      ...props,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return success(message);
  }

  /**
   * Reconstitute Message from database
   */
  static fromPersistence(data: MessageProps): Message {
    return new Message(data);
  }

  /**
   * Delete message (soft delete)
   */
  delete(): Result<void, DomainError> {
    if (this.props.isDeleted) {
      return failure(
        new DomainError(ErrorCode.MESSAGE_ALREADY_DELETED, 'Message is already deleted')
      );
    }

    this.props.isDeleted = true;
    this.props.updatedAt = new Date();
    return success(undefined);
  }

  /**
   * Check if message can be deleted by user
   */
  canBeDeletedBy(identity: string): boolean {
    return this.props.identity === identity && !this.props.isDeleted;
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
      message: this.props.message,
      isDeleted: this.props.isDeleted ? 1 : 0,
      dtmCreated: this.props.createdAt,
      dtmUpdated: this.props.updatedAt,
    };
  }
}
