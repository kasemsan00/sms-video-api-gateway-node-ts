/**
 * Room Created Event
 * Fired when a new room is created
 */

import { BaseDomainEvent } from './base.event.js';
import { RoomType } from '@shared/constants/index.js';

export class RoomCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly roomId: number,
    public readonly roomName: string,
    public readonly roomType: RoomType,
    public readonly service: number
  ) {
    super();
  }

  get eventName(): string {
    return 'RoomCreated';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      roomId: this.roomId,
      roomName: this.roomName,
      roomType: this.roomType,
      service: this.service,
    };
  }
}
