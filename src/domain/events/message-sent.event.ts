/**
 * Message Sent Event
 * Fired when a chat message is sent
 */

import { BaseDomainEvent } from './base.event.js';

export class MessageSentEvent extends BaseDomainEvent {
  constructor(
    public readonly messageId: number,
    public readonly roomName: string,
    public readonly identity: string,
    public readonly userName: string,
    public readonly message: string
  ) {
    super();
  }

  get eventName(): string {
    return 'MessageSent';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      messageId: this.messageId,
      roomName: this.roomName,
      identity: this.identity,
      userName: this.userName,
      message: this.message,
    };
  }
}
