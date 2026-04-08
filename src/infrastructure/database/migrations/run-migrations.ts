/**
 * Migration Runner Script
 *
 * Run this script to execute all pending migrations.
 * Usage: npm run migrate
 */

import 'dotenv/config';
import { createDatabaseAdapterFromEnv } from '../adapters';
import { MigrationRunner } from './MigrationRunner';
import { schemaMigrations } from './schemas';
import { postgresqlSchemaMigrations } from './postgresql-schemas';
import { config } from '../../../config';

async function runMigrations(): Promise<void> {
  console.log('🔄 Starting database migrations...\n');

  const adapter = await createDatabaseAdapterFromEnv();
  const runner = new MigrationRunner(adapter);

  // Use appropriate migrations based on database type
  const migrations =
    config.database.type === 'postgresql' ? postgresqlSchemaMigrations : schemaMigrations;

  console.log(`   Database type: ${config.database.type}\n`);

  try {
    const status = await runner.getStatus(migrations);

    console.log(`📊 Migration Status:`);
    console.log(`   Applied: ${status.applied.length}`);
    console.log(`   Pending: ${status.pending.length}\n`);

    if (status.pending.length === 0) {
      console.log('✅ All migrations are up to date!');
      return;
    }

    await runner.runMigrations(migrations);
    console.log('\n✅ Migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await adapter.close();
  }
}

// Run if executed directly
if (require.main === module) {
  void runMigrations();
}

export { runMigrations };
