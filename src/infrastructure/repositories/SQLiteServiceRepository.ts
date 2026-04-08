/**
 * SQLite Service Repository
 *
 * Implementation of ServiceRepository using SQLite.
 */

import { DatabaseAdapter } from '../database/adapters/DatabaseAdapter';
import { Service } from '../../domain/entities/Service';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  is_active: number;
  created_at: string;
}

export class SQLiteServiceRepository implements ServiceRepository {
  constructor(private readonly db: DatabaseAdapter) {}

  private mapRowToService(row: ServiceRow): Service {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
    };
  }

  async findById(id: string): Promise<Service | null> {
    const row = await this.db.queryOne<ServiceRow>('SELECT * FROM services WHERE id = ?', [id]);
    return row ? this.mapRowToService(row) : null;
  }

  async findByName(name: string): Promise<Service | null> {
    const row = await this.db.queryOne<ServiceRow>(
      'SELECT * FROM services WHERE LOWER(name) = LOWER(?)',
      [name],
    );
    return row ? this.mapRowToService(row) : null;
  }

  async findAll(): Promise<Service[]> {
    const rows = await this.db.query<ServiceRow>(
      'SELECT * FROM services WHERE is_active = 1 ORDER BY name',
    );
    return rows.map(this.mapRowToService);
  }

  async save(service: Service): Promise<void> {
    await this.db.execute(
      `INSERT INTO services (id, name, category, is_active, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        service.id,
        service.name,
        service.category,
        service.isActive ? 1 : 0,
        service.createdAt.toISOString(),
      ],
    );
  }

  async update(id: string, updates: Partial<Service>): Promise<void> {
    const fields: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    if (fields.length === 0) return;

    values.push(id);

    await this.db.execute(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}
