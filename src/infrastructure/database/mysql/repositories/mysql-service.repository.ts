/**
 * MySQL Service Repository Implementation
 */

import { injectable } from 'tsyringe';
import { RowDataPacket } from 'mysql2/promise';
import { BaseRepository } from '../base-repository.js';
import { Service } from '@domain/entities/service.entity.js';
import { IServiceRepository } from '@domain/repositories/service.repository.interface.js';
import { Result, success, failure } from '@shared/types/result.type.js';
import { AppError } from '@shared/errors/base.error.js';
import { ErrorCode } from '@shared/constants/error-codes.constant.js';

@injectable()
export class MySqlServiceRepository extends BaseRepository<Service> implements IServiceRepository {
  constructor() {
    super('services');
  }

  /**
   * Map database row to Service entity
   */
  protected mapToDomain(row: RowDataPacket): Result<Service, AppError> {
    try {
      const service = Service.fromPersistence({
        id: row.id,
        name: row.name,
        description: row.description,
        isActive: row.isActive === 1,
        config: row.config,
        createdAt: row.dtmCreated ? new Date(row.dtmCreated) : new Date(),
        updatedAt: row.dtmUpdated ? new Date(row.dtmUpdated) : new Date(),
      });

      return success(service);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(
        new AppError(
          ErrorCode.DATABASE_ERROR,
          `Failed to map service from database: ${message}`,
          500,
          { row, originalError: message }
        )
      );
    }
  }

  /**
   * Map Service entity to database row
   */
  protected mapToDatabase(service: Service): Record<string, unknown> {
    const persistence = service.toPersistence();
    return {
      id: persistence.id,
      name: persistence.name,
      description: persistence.description,
      isActive: persistence.isActive,
      config: persistence.config,
      dtmCreated: persistence.dtmCreated,
      dtmUpdated: persistence.dtmUpdated,
    };
  }

  /**
   * Find service by ID
   */
  async findById(id: number): Promise<Service | null> {
    const result = await this.findOneById(id);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Find service by name
   */
  async findByName(name: string): Promise<Service | null> {
    const result = await this.findBy({ name });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value.length > 0 ? result.value[0] : null;
  }

  /**
   * Find all services
   */
  async findAll(): Promise<Service[]> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.select().from(this.tableName).build();

    const result = await this.executeQuery<RowDataPacket[]>(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const services: Service[] = [];
    for (const row of result.value) {
      const serviceResult = this.mapToDomain(row);
      if (serviceResult.isFailure) {
        throw serviceResult.error;
      }
      services.push(serviceResult.value);
    }

    return services;
  }

  /**
   * Find active services
   */
  async findActive(): Promise<Service[]> {
    const result = await this.findBy({ isActive: 1 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * Create a new service
   */
  async create(service: Service): Promise<Service> {
    const data = this.mapToDatabase(service);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.insert(this.tableName, data);

    const result = await this.executeInsert(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    const insertId = result.value;

    // Fetch the created service
    const createdService = await this.findById(insertId);
    if (!createdService) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch created service',
        500
      );
    }

    return createdService;
  }

  /**
   * Update a service
   */
  async update(service: Service): Promise<Service> {
    const data = this.mapToDatabase(service);
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(this.tableName, data, { id: service.id });

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.SERVICE_NOT_FOUND,
        `Service with ID ${service.id} not found`,
        404
      );
    }

    // Fetch the updated service
    const updatedService = await this.findById(service.id);
    if (!updatedService) {
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch updated service',
        500
      );
    }

    return updatedService;
  }

  /**
   * Delete a service
   */
  async delete(id: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.delete(this.tableName, { id });

    const result = await this.executeDelete(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.SERVICE_NOT_FOUND,
        `Service with ID ${id} not found`,
        404
      );
    }
  }

  /**
   * Activate a service
   */
  async activate(id: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { isActive: 1, dtmUpdated: new Date() },
      { id }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.SERVICE_NOT_FOUND,
        `Service with ID ${id} not found`,
        404
      );
    }
  }

  /**
   * Deactivate a service
   */
  async deactivate(id: number): Promise<void> {
    const qb = this.createQueryBuilder();
    const { sql, params } = qb.update(
      this.tableName,
      { isActive: 0, dtmUpdated: new Date() },
      { id }
    );

    const result = await this.executeUpdate(sql, params);

    if (result.isFailure) {
      throw result.error;
    }

    if (result.value === 0) {
      throw new AppError(
        ErrorCode.SERVICE_NOT_FOUND,
        `Service with ID ${id} not found`,
        404
      );
    }
  }

  /**
   * Count active services
   */
  async countActive(): Promise<number> {
    const result = await this.countBy({ isActive: 1 });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}
