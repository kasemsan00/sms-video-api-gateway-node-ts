/**
 * Case Repository Interface
 * Defines the contract for case data persistence
 */

import { Case } from '../entities/case.entity.js';
import { PaginatedResult, PaginationParams } from '@shared/types/index.js';

export interface ICaseRepository {
  // Read operations
  findById(id: number): Promise<Case | null>;
  findByRoom(room: string): Promise<Case[]>;
  findByCaseNumber(caseNumber: string): Promise<Case | null>;
  findByStatus(status: string): Promise<Case[]>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Case>>;

  // Write operations
  create(caseEntity: Case): Promise<Case>;
  update(caseEntity: Case): Promise<Case>;
  delete(id: number): Promise<void>;

  // Specific operations
  updateStatus(id: number, status: string): Promise<void>;
  countByRoom(room: string): Promise<number>;
  countByStatus(status: string): Promise<number>;
}
