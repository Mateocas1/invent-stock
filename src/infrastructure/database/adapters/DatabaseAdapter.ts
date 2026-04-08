/**
 * DatabaseAdapter Interface
 *
 * Abstraction for database operations that works with both SQLite and PostgreSQL.
 * Provides a unified interface for queries, execution, and transactions.
 */

/**
 * Represents a database row with unknown structure.
 * Can be cast to specific entity types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbRow = Record<string, any>;

/**
 * DatabaseAdapter interface for all database operations.
 * Implemented by SQLiteDatabaseAdapter and PostgreSQLDatabaseAdapter.
 */
export interface DatabaseAdapter {
  /**
   * Execute a SELECT query and return results.
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Array of rows
   */
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Execute a SELECT query and return a single result.
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Single row or null
   */
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;

  /**
   * Execute an INSERT, UPDATE, or DELETE statement.
   * @param sql - SQL statement
   * @param params - Statement parameters
   */
  execute(sql: string, params?: unknown[]): Promise<void>;

  /**
   * Execute a statement and return the last inserted ID.
   * @param sql - SQL statement
   * @param params - Statement parameters
   * @returns The ID of the last inserted row
   */
  insert(sql: string, params?: unknown[]): Promise<string>;

  /**
   * Execute a statement and return the number of affected rows.
   * @param sql - SQL statement
   * @param params - Statement parameters
   * @returns Number of rows affected
   */
  executeAndGetCount(sql: string, params?: unknown[]): Promise<number>;

  /**
   * Execute multiple statements within a transaction.
   * The transaction is automatically committed if the callback succeeds,
   * or rolled back if it throws an error.
   * @param fn - Callback function that receives a transaction adapter
   * @returns Result of the callback function
   */
  transaction<T>(fn: (tx: DatabaseAdapter) => Promise<T>): Promise<T>;

  /**
   * Close the database connection.
   */
  close(): Promise<void>;

  /**
   * Check if the database connection is active.
   */
  isConnected(): boolean;
}

/**
 * Configuration options for database adapters.
 */
export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  sqlitePath?: string;
  connectionString?: string;
}
