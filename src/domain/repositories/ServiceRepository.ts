/**
 * Service Repository Interface
 *
 * Defines the contract for service data access.
 */

import { Service } from '../entities/Service';

export interface ServiceRepository {
  /**
   * Find a service by its ID.
   */
  findById(id: string): Promise<Service | null>;

  /**
   * Find a service by its name (case-insensitive).
   */
  findByName(name: string): Promise<Service | null>;

  /**
   * Get all services.
   */
  findAll(): Promise<Service[]>;

  /**
   * Save a new service.
   */
  save(service: Service): Promise<void>;

  /**
   * Update an existing service.
   */
  update(id: string, updates: Partial<Service>): Promise<void>;
}
