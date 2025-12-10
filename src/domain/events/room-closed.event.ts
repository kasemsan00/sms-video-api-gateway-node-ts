/**
 * Room Closed Event
 * Fired when a room is closed
 */

import { BaseDomainEvent } from './base.event.js';

export class RoomClosedEvent extends BaseDomainEvent {
  constructor(
    public readonly roomId: number,
    public readonly roomName: string,
    public readonly closedBy?: string
  ) {
    super();
  }

  get eventName(): string {
    return 'RoomClosed';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      roomId: this.roomId,
      roomName: this.roomName,
      closedBy: this.closedBy,
    };
  }
}
