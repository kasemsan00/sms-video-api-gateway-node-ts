/**
 * Service Entity
 * Represents a service configuration
 */

import { Result, success } from '@shared/types/index.js';
import { DomainError } from '@shared/errors/index.js';

interface ServiceProps {
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
  config?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CreateServiceProps {
  name: string;
  description?: string;
  isActive?: boolean;
  config?: string;
}

export class Service {
  private constructor(private props: ServiceProps) {}

  // Getters
  get id(): number {
    return this.props.id!;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get config(): string | undefined {
    return this.props.config;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  /**
   * Factory method to create a new Service
   */
  static create(props: CreateServiceProps): Result<Service, DomainError> {
    const now = new Date();

    const service = new Service({
      ...props,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return success(service);
  }

  /**
   * Reconstitute Service from database
   */
  static fromPersistence(data: ServiceProps): Service {
    return new Service(data);
  }

  /**
   * Activate service
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate service
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Update service configuration
   */
  updateConfig(config: string): void {
    this.props.config = config;
    this.props.updatedAt = new Date();
  }

  /**
   * Update service description
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
      name: this.props.name,
      description: this.props.description ?? '',
      isActive: this.props.isActive ? 1 : 0,
      config: this.props.config ?? '',
      dtmCreated: this.props.createdAt,
      dtmUpdated: this.props.updatedAt,
    };
  }
}
