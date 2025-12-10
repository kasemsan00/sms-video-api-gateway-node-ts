/**
 * User Joined Event
 * Fired when a user joins a room
 */

import { BaseDomainEvent } from './base.event.js';
import { UserType } from '@shared/constants/index.js';

export class UserJoinedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: number,
    public readonly roomName: string,
    public readonly identity: string,
    public readonly userName: string,
    public readonly userType: UserType
  ) {
    super();
  }

  get eventName(): string {
    return 'UserJoined';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      userId: this.userId,
      roomName: this.roomName,
      identity: this.identity,
      userName: this.userName,
      userType: this.userType,
    };
  }
}
