/**
 * Debug Database Tool
 *
 * Usage: tsx scripts/debug-db.ts
 */

import 'dotenv/config';
import { createDatabaseAdapterFromEnv } from '../src/infrastructure/database/adapters';
import { runSeeds } from '../src/infrastructure/database/seeds/run-seeds';

async function debugDatabase() {
  console.log('🔍 DEBUG DATABASE TOOL');
  console.log('='.repeat(50));

  try {
    const db = await createDatabaseAdapterFromEnv();
    console.log('✅ Database connected');

    // Check schema
    let schema = 'unknown';
    try {
      const schemaRes = await db.query('SELECT current_schema() as schema');
      schema = schemaRes[0]?.schema || 'unknown';
      console.log(`📖 Current schema: ${schema}`);
    } catch (err) {
      console.warn('⚠️ Could not get current schema:', err);
    }

    // List all tables
    let tables: string[] = [];
    try {
      const tablesRes = await db.query(
        'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()',
      );
      tables = tablesRes.map((row: any) => row.table_name);
      console.log(`📋 Tables found (${tables.length}):`);
      console.log(`   ${tables.join(', ')}`);
    } catch (err) {
      console.warn('⚠️ Could not list tables:', err);
    }

    // Check critical tables
    const checkTable = async (table: string) => {
      try {
        const res = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = res[0]?.count || 0;
        console.log(`📊 ${table}: ${count} records`);
        return true;
      } catch (err) {
        console.log(`🚫 ${table}: does not exist or inaccessible`);
        return false;
      }
    };

    await checkTable('_migrations');
    await checkTable('products');
    await checkTable('services');
    await checkTable('recipes');

    // Try to run seeds if empty
    if (tables.length < 5) {
      console.log('\n⚠️ Database appears empty - running seed migrations...');
      try {
        await runSeeds();
        console.log('✅ Seeds completed');
      } catch (err) {
        console.error('❌ Seed failed:', err);
      }
    }

    // Final verification
    console.log('\n🔍 FINAL STATUS');
    console.log('='.repeat(50));
    await checkTable('_migrations');
    await checkTable('products');
    await checkTable('services');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
}

// Run the debug tool
debugDatabase();
