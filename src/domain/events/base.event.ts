/**
 * Base Domain Event
 * All domain events should extend this class
 */

export abstract class BaseDomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;

  constructor() {
    this.occurredAt = new Date();
    this.eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  abstract get eventName(): string;

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}
