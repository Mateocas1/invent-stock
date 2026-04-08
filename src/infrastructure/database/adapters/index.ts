/**
 * Database Adapter Factory
 *
 * Creates the appropriate database adapter based on configuration.
 */

import { DatabaseAdapter, DatabaseConfig as AdapterDatabaseConfig } from './DatabaseAdapter';
import { SQLiteDatabaseAdapter } from './SQLiteAdapter';
import { PostgreSQLDatabaseAdapter, PostgreSQLConfig } from './PostgreSQLAdapter';
import { config } from '../../../config';

/**
 * Create a database adapter based on configuration.
 * Automatically connects to the database.
 */
export async function createDatabaseAdapter(
  adapterConfig: AdapterDatabaseConfig,
): Promise<DatabaseAdapter> {
  if (adapterConfig.type === 'sqlite') {
    if (!adapterConfig.sqlitePath) {
      throw new Error('SQLite path is required when using SQLite database');
    }
    const adapter = new SQLiteDatabaseAdapter({ path: adapterConfig.sqlitePath });
    await adapter.connect();
    return adapter;
  }

  if (adapterConfig.type === 'postgresql') {
    const pgConfig: PostgreSQLConfig = {};

    if (adapterConfig.connectionString) {
      pgConfig.connectionString = adapterConfig.connectionString;
    } else {
      throw new Error('PostgreSQL connection string is required');
    }

    const adapter = new PostgreSQLDatabaseAdapter(pgConfig);
    await adapter.connect();
    return adapter;
  }

  throw new Error(`Unsupported database type: ${adapterConfig.type}`);
}

/**
 * Create a database adapter from environment variables.
 * Uses the centralized config module.
 */
export async function createDatabaseAdapterFromEnv(): Promise<DatabaseAdapter> {
  // Use centralized config
  const dbType = config.database.type;

  if (dbType === 'sqlite') {
    const sqlitePath = config.database.path ?? './.data/invent-stock.db';
    return createDatabaseAdapter({
      type: 'sqlite',
      sqlitePath,
    });
  }

  if (dbType === 'postgresql') {
    const connectionString = config.database.url;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
    }
    return createDatabaseAdapter({
      type: 'postgresql',
      connectionString,
    });
  }

  throw new Error(`Unsupported DB_TYPE: ${dbType}`);
}
