/**
 * Database Inspection Script
 *
 * Diagnose why "products" table appears missing.
 * Usage: tsx scripts/db-inspect.ts
 */

import 'dotenv/config';
import { Client } from 'pg';

interface TableStatus {
  exists: boolean;
  count: number;
  columns?: string[];
}

async function inspectDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Database connection successful
');

    // Get schemas and search_path
    const schemaInfo = await client.query("SHOW search_path");
    const schemas = schemaInfo.rows[0]?.search_path || '';
    console.log(`🌐 Schema search path: ${schemas}`);

    // Inspect critical tables
    const tablesToCheck = [
      '_migrations',
      'products',
      'services',
      'recipes',
      'stock_alerts',
      'inventory_transactions',
      'consumption_history',
    ];

    const results: Record<string, TableStatus> = {};
    const problems: string[] = [];

    for (const table of tablesToCheck) {
      try {
        // Check if table exists
        const existsQuery = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = (SELECT current_scheme())
            AND table_name = $1
          )`, [table]
        );
        const exists = existsQuery.rows[0].exists;

        let count = 0;
        if (exists) {
          // Get record count
          const countQuery = await client.query(`SELECT COUNT(*) FROM ${table}`);
          count = Number(countQuery.rows[0].count);
        } else {
          problems.push(table);
        }

        results[table] = { exists, count };
      } catch (error) {
        results[table] = { exists: false, count: 0 };
        problems.push(table);
      }
    }

    // Output results
    console.log('📊 Database Table Status:');
    console.log('Table'.padEnd(25) + '| Exists | Records');
    console.log('-'.repeat(40));
    for (const [table, status] of Object.entries(results)) {
      console.log(
        table.padEnd(25) +
        '| ' +
        (status.exists ? '✅' : '❌').padEnd(6) +
        ' | ' +
        status.count
      );
    }

    console.log('');
    if (problems.length > 0) {
      console.log('⚠️  Critical tables missing:');
      for (const table of problems) {
        console.log(`  • ${table}`);
      }
    } else {
      console.log('✅ All critical tables exist!');
    }

    // Check migration status
    const migrationData = results._migrations;
    if (migrationData.exists) {
      console.log(`\n🔄 Migration status: ${migrationData.count} migrations applied`);
      if (migrationData.count > 0) {
        const latestMigration = await client.query(
          'SELECT id FROM _migrations ORDER BY timestamp DESC LIMIT 1'
        );
        console.log(`Last migration: ${latestMigration.rows[0]?.id || 'unknown'}`);
      }
    }

    // Check detailed state of key tables
    if (results.products.exists && results.products.count === 0) {
      console.log('\n💡 products table exists but is empty - seed data not loaded');
    }
    if (results.services.exists && results.services.count === 0) {
      console.log('💡 services table exists but is empty - seed data not loaded');
    }

  } catch (error) {
    console.error('❌ Inspection failed:', error);
  } finally {
    await client.end();
  }
}

// Run the inspection
inspectDatabase();