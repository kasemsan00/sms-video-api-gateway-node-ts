/**
 * Service Repository Interface
 * Defines the contract for service data persistence
 */

import { Service } from '../entities/service.entity.js';

export interface IServiceRepository {
  // Read operations
  findById(id: number): Promise<Service | null>;
  findByName(name: string): Promise<Service | null>;
  findAll(): Promise<Service[]>;
  findActive(): Promise<Service[]>;

  // Write operations
  create(service: Service): Promise<Service>;
  update(service: Service): Promise<Service>;
  delete(id: number): Promise<void>;

  // Specific operations
  activate(id: number): Promise<void>;
  deactivate(id: number): Promise<void>;
  countActive(): Promise<number>;
}
