/**
 * Migration System
 *
 * Simple migration runner that executes SQL files in order.
 * Tracks applied migrations in a _migrations table.
 */

import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { SQLiteDatabaseAdapter } from '../adapters/SQLiteAdapter';
import { PostgreSQLDatabaseAdapter } from '../adapters/PostgreSQLAdapter';

export interface Migration {
  id: string;
  name: string;
  sql: string;
  timestamp: number;
}

export interface MigrationRecord {
  id: string;
  name: string;
  applied_at: string;
}

/**
 * Migration runner class.
 */
export class MigrationRunner {
  private adapter: DatabaseAdapter;
  private isPostgreSQL: boolean;

  constructor(adapter: DatabaseAdapter) {
    this.adapter = adapter;
    this.isPostgreSQL = adapter instanceof PostgreSQLDatabaseAdapter;
  }

  /**
   * Initialize the migrations table.
   */
  async initialize(): Promise<void> {
    const sql = this.isPostgreSQL
      ? `CREATE TABLE IF NOT EXISTS _migrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`
      : `CREATE TABLE IF NOT EXISTS _migrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`;

    await this.adapter.execute(sql);
  }

  /**
   * Get list of applied migrations.
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    try {
      return await this.adapter.query<MigrationRecord>(
        'SELECT * FROM _migrations ORDER BY applied_at ASC',
      );
    } catch {
      // Table might not exist yet
      return [];
    }
  }

  /**
   * Check if a migration has been applied.
   */
  async isMigrationApplied(id: string): Promise<boolean> {
    const sql = this.isPostgreSQL
      ? 'SELECT * FROM _migrations WHERE id = $1'
      : 'SELECT * FROM _migrations WHERE id = ?';
    const results = await this.adapter.query<MigrationRecord>(sql, [id]);
    return results.length > 0;
  }

  /**
   * Run a single migration.
   */
  async runMigration(migration: Migration): Promise<void> {
    const alreadyApplied = await this.isMigrationApplied(migration.id);
    if (alreadyApplied) {
      console.log(`Migration ${migration.id} already applied, skipping...`);
      return;
    }

    console.log(`Running migration: ${migration.id} - ${migration.name}`);

    await this.adapter.transaction(async () => {
      // For SQLite with multi-statement SQL, use exec()
      if (this.adapter instanceof SQLiteDatabaseAdapter) {
        await this.adapter.exec(migration.sql);
      } else {
        // For PostgreSQL, execute multi-statement SQL
        // Note: pg driver handles multi-statement in a single query
        await this.adapter.execute(migration.sql);
      }

      // Record the migration
      const insertSql = this.isPostgreSQL
        ? 'INSERT INTO _migrations (id, name) VALUES ($1, $2)'
        : 'INSERT INTO _migrations (id, name) VALUES (?, ?)';
      await this.adapter.execute(insertSql, [migration.id, migration.name]);
    });

    console.log(`Migration ${migration.id} completed successfully`);
  }

  /**
   * Run multiple migrations.
   */
  async runMigrations(migrations: Migration[]): Promise<void> {
    await this.initialize();

    for (const migration of migrations) {
      await this.runMigration(migration);
    }

    console.log(`All migrations completed. ${migrations.length} migrations processed.`);
  }

  /**
   * Get migration status.
   */
  async getStatus(allMigrations: Migration[]): Promise<{
    applied: MigrationRecord[];
    pending: Migration[];
  }> {
    await this.initialize();
    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));

    const pending = allMigrations.filter(m => !appliedIds.has(m.id));

    return { applied, pending };
  }
}
