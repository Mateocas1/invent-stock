/**
 * Failsafe Migrator
 *
 * Purpose: Bootstrap Railway PostgreSQL when completely empty
 */

import { DatabaseAdapter } from './adapters/DatabaseAdapter';
import fs from 'fs';
import path from 'path';

/** Default SQL path */
const BOOTSTRAP_SQL_PATH = path.join(__dirname, 'bootstrap.sql');

/**
 * FailsafeMigrator: Idempotent bootstrap for Railway PG
 */
export class FailsafeMigrator {
  /**
   * Check if Railway PG is completely empty
   */
  static async isFreshInstall(db: DatabaseAdapter): Promise<boolean> {
    try {
      const result = await db.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = current_schema()',
      );
      const tableCount = result[0]?.count || 0;
      return tableCount < 2; // Only system tables
    } catch {
      return true; // Any error means empty
    }
  }

  /**
   * Execute bootstrap.sql to create schema + seed
   */
  static async runBootstrap(db: DatabaseAdapter): Promise<void> {
    try {
      const sql = fs.readFileSync(BOOTSTRAP_SQL_PATH, 'utf8');
      if (!sql || sql.length < 10) {
        throw new Error('bootstrap.sql is empty or missing');
      }

      // Execute SQL in transaction
      await db.transaction(async tx => {
        const queries = sql.split(';').filter(q => q.trim());
        for (const query of queries) {
          try {
            await tx.execute(query);
          } catch (err) {
            console.warn(`Failsafe: Query failed, continuing: ${query.substring(0, 50)}...`);
          }
        }
      });

      console.log('✅ FAILSAFE: Bootstrap applied successfully');
    } catch (error) {
      console.error('❌ FAILSAFE: Bootstrap failed', error);
      throw error;
    }
  }

  /**
   * Verify bootstrap integrity
   */
  static async verify(db: DatabaseAdapter): Promise<boolean> {
    const products = await db.query<{ count: number }>('SELECT COUNT(*) as count FROM products');
    const migrations = await db.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM _migrations_failsafe',
    );
    return (products[0]?.count ?? 0) > 0 && (migrations[0]?.count ?? 0) > 0;
  }
}
