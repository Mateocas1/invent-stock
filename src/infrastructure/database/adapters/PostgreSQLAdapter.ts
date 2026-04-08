/**
 * PostgreSQL Database Adapter
 *
 * Implementation of DatabaseAdapter using node-postgres (pg).
 * Designed for production deployments with PostgreSQL.
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { DatabaseAdapter } from './DatabaseAdapter';

export interface PostgreSQLConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
  maxConnections?: number;
}

export class PostgreSQLDatabaseAdapter implements DatabaseAdapter {
  private pool: Pool | null = null;
  private config: PostgreSQLConfig;
  private connected = false;

  constructor(config: PostgreSQLConfig) {
    this.config = config;
  }

  /**
   * Initialize the database connection pool.
   * Must be called before any other operations.
   */
  async connect(): Promise<void> {
    if (this.pool) {
      return;
    }

    const poolConfig: PoolConfig = {};

    if (this.config.connectionString) {
      poolConfig.connectionString = this.config.connectionString;
    } else {
      poolConfig.host = this.config.host ?? 'localhost';
      poolConfig.port = this.config.port ?? 5432;
      poolConfig.database = this.config.database;
      poolConfig.user = this.config.user;
      poolConfig.password = this.config.password;
    }

    if (this.config.ssl !== undefined) {
      poolConfig.ssl = this.config.ssl;
    }

    if (this.config.maxConnections) {
      poolConfig.max = this.config.maxConnections;
    }

    this.pool = new Pool(poolConfig);

    // Test connection
    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      this.connected = true;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a SELECT query and return results.
   */
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    this.ensureConnected();
    const result = await this.pool!.query(sql, params);
    return result.rows as T[];
  }

  /**
   * Execute a SELECT query and return a single result.
   */
  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE statement.
   */
  async execute(sql: string, params?: unknown[]): Promise<void> {
    this.ensureConnected();
    await this.pool!.query(sql, params);
  }

  /**
   * Execute an INSERT statement and return the last inserted ID.
   * Note: PostgreSQL uses RETURNING clause for this.
   */
  async insert(sql: string, params?: unknown[]): Promise<string> {
    this.ensureConnected();
    const result = await this.pool!.query(sql, params);
    if (result.rows.length > 0) {
      const firstRow = result.rows[0];
      const idValue = firstRow.id ?? firstRow[0];
      return idValue?.toString() ?? '';
    }
    return '';
  }

  /**
   * Execute a statement and return the number of affected rows.
   */
  async executeAndGetCount(sql: string, params?: unknown[]): Promise<number> {
    this.ensureConnected();
    const result = await this.pool!.query(sql, params);
    return result.rowCount ?? 0;
  }

  /**
   * Execute multiple statements within a transaction.
   */
  async transaction<T>(fn: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.ensureConnected();
    const client = await this.pool!.connect();

    try {
      await client.query('BEGIN');

      // Create a transaction-scoped adapter using the client
      const txAdapter: DatabaseAdapter = {
        query: async <T>(sql: string, params?: unknown[]) => {
          const result = await client.query(sql, params);
          return result.rows as T[];
        },
        queryOne: async <T>(sql: string, params?: unknown[]) => {
          const result = await client.query(sql, params);
          return result.rows.length > 0 ? (result.rows[0] as T) : null;
        },
        execute: async (sql: string, params?: unknown[]) => {
          await client.query(sql, params);
        },
        insert: async (sql: string, params?: unknown[]) => {
          const result = await client.query(sql, params);
          if (result.rows.length > 0) {
            const firstRow = result.rows[0];
            const idValue = firstRow.id ?? firstRow[0];
            return idValue?.toString() ?? '';
          }
          return '';
        },
        executeAndGetCount: async (sql: string, params?: unknown[]) => {
          const result = await client.query(sql, params);
          return result.rowCount ?? 0;
        },
        transaction: async <T>(fn: (tx: DatabaseAdapter) => Promise<T>) => {
          // Nested transactions use savepoints
          await client.query('SAVEPOINT nested_tx');
          try {
            const result = await fn(txAdapter);
            await client.query('RELEASE SAVEPOINT nested_tx');
            return result;
          } catch (error) {
            await client.query('ROLLBACK TO SAVEPOINT nested_tx');
            throw error;
          }
        },
        close: () => Promise.resolve(),
        isConnected: () => true,
      };

      const result = await fn(txAdapter);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection pool.
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
    }
  }

  /**
   * Check if the database connection is active.
   */
  isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  /**
   * Get the raw Pool instance for advanced operations.
   */
  getRawPool(): Pool {
    this.ensureConnected();
    return this.pool!;
  }

  /**
   * Get a client from the pool for manual transaction management.
   * Remember to call client.release() when done!
   */
  async getClient(): Promise<PoolClient> {
    this.ensureConnected();
    return this.pool!.connect();
  }

  private ensureConnected(): void {
    if (!this.pool || !this.connected) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }
}
