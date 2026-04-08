/**
 * SQLite Database Adapter
 *
 * Implementation of DatabaseAdapter using better-sqlite3.
 * Optimized for local development and small deployments.
 */

import Database from 'better-sqlite3';
import { DatabaseAdapter } from './DatabaseAdapter';

export interface SQLiteConfig {
  path: string;
  verbose?: boolean;
}

export class SQLiteDatabaseAdapter implements DatabaseAdapter {
  private db: Database.Database | null = null;
  private config: SQLiteConfig;

  constructor(config: SQLiteConfig) {
    this.config = config;
  }

  /**
   * Initialize the database connection.
   * Must be called before any other operations.
   */
  async connect(): Promise<void> {
    if (this.db) {
      return;
    }

    const options: Database.Options = {};
    if (this.config.verbose) {
      options.verbose = console.log;
    }

    this.db = new Database(this.config.path, options);

    // Enable foreign keys
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Execute a SELECT query and return results.
   */
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    this.ensureConnected();
    const stmt = this.db!.prepare(sql);
    const results = params ? stmt.all(...params) : stmt.all();
    return results as T[];
  }

  /**
   * Execute a SELECT query and return a single result.
   */
  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    this.ensureConnected();
    const stmt = this.db!.prepare(sql);
    const result = params ? stmt.get(...params) : stmt.get();
    return (result as T) ?? null;
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE statement.
   */
  async execute(sql: string, params?: unknown[]): Promise<void> {
    this.ensureConnected();
    const stmt = this.db!.prepare(sql);
    if (params) {
      stmt.run(...params);
    } else {
      stmt.run();
    }
  }

  /**
   * Execute an INSERT statement and return the last inserted ID.
   */
  async insert(sql: string, params?: unknown[]): Promise<string> {
    this.ensureConnected();
    const stmt = this.db!.prepare(sql);
    const result = params ? stmt.run(...params) : stmt.run();
    return result.lastInsertRowid?.toString() ?? '';
  }

  /**
   * Execute a statement and return the number of affected rows.
   */
  async executeAndGetCount(sql: string, params?: unknown[]): Promise<number> {
    this.ensureConnected();
    const stmt = this.db!.prepare(sql);
    const result = params ? stmt.run(...params) : stmt.run();
    return result.changes;
  }

  /**
   * Execute multiple statements within a transaction.
   */
  async transaction<T>(fn: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.ensureConnected();

    // Create a transaction-scoped adapter
    const txAdapter: DatabaseAdapter = {
      query: <U>(sql: string, params?: unknown[]) => this.query<U>(sql, params),
      queryOne: <U>(sql: string, params?: unknown[]) => this.queryOne<U>(sql, params),
      execute: (sql: string, params?: unknown[]) => this.execute(sql, params),
      insert: (sql: string, params?: unknown[]) => this.insert(sql, params),
      executeAndGetCount: (sql: string, params?: unknown[]) => this.executeAndGetCount(sql, params),
      transaction: <U>(txnFn: (tx: DatabaseAdapter) => Promise<U>) => this.transaction(txnFn),
      close: () => Promise.resolve(),
      isConnected: () => this.isConnected(),
    };

    // SQLite transactions in better-sqlite3 are synchronous
    // We wrap the async callback manually
    this.db!.prepare('BEGIN').run();
    try {
      const result = await fn(txAdapter);
      this.db!.prepare('COMMIT').run();
      return result;
    } catch (error) {
      this.db!.prepare('ROLLBACK').run();
      throw error;
    }
  }

  /**
   * Close the database connection.
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Check if the database connection is active.
   */
  isConnected(): boolean {
    return this.db !== null;
  }

  /**
   * Get the raw better-sqlite3 instance for advanced operations.
   */
  getRawDatabase(): Database.Database {
    this.ensureConnected();
    return this.db!;
  }

  /**
   * Execute multiple SQL statements (useful for migrations).
   */
  async exec(sql: string): Promise<void> {
    this.ensureConnected();
    this.db!.exec(sql);
  }

  private ensureConnected(): void {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }
}
