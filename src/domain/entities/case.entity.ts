/**
 * Case Entity
 * Represents a case/incident associated with a room
 */

import { Result, success } from '@shared/types/index.js';
import { DomainError } from '@shared/errors/index.js';

interface CaseProps {
  id?: number;
  room: string;
  caseNumber?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateCaseProps {
  room: string;
  caseNumber?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
}

export class Case {
  private constructor(private props: CaseProps) {}

  // Getters
  get id(): number {
    return this.props.id!;
  }

  get room(): string {
    return this.props.room;
  }

  get caseNumber(): string | undefined {
    return this.props.caseNumber;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): string | undefined {
    return this.props.status;
  }

  get priority(): string | undefined {
    return this.props.priority;
  }

  get assignedTo(): string | undefined {
    return this.props.assignedTo;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  /**
   * Factory method to create a new Case
   */
  static create(props: CreateCaseProps): Result<Case, DomainError> {
    const now = new Date();

    const caseEntity = new Case({
      ...props,
      status: props.status ?? 'open',
      priority: props.priority ?? 'normal',
      createdAt: now,
      updatedAt: now,
    });

    return success(caseEntity);
  }

  /**
   * Reconstitute Case from database
   */
  static fromPersistence(data: CaseProps): Case {
    return new Case(data);
  }

  /**
   * Update case status
   */
  updateStatus(status: string): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  /**
   * Update case priority
   */
  updatePriority(priority: string): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }

  /**
   * Assign case to user
   */
  assignTo(userId: string): void {
    this.props.assignedTo = userId;
    this.props.updatedAt = new Date();
  }

  /**
   * Update case description
   */
  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.props.id,
      room: this.props.room,
      caseNumber: this.props.caseNumber ?? '',
      description: this.props.description ?? '',
      status: this.props.status,
      priority: this.props.priority,
      assignedTo: this.props.assignedTo ?? '',
      dtmCreated: this.props.createdAt,
      dtmUpdated: this.props.updatedAt,
    };
  }
}
