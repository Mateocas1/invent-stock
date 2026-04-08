/**
 * Seed Runner Script
 *
 * Run this script to seed the database with initial data.
 * Usage: npm run seed
 */

import 'dotenv/config';
import { createDatabaseAdapterFromEnv } from '../adapters';
import { MigrationRunner } from '../migrations/MigrationRunner';
import { seedMigrations } from './seed-data';

async function runSeeds(): Promise<void> {
  console.log('🌱 Starting database seeding...\n');

  const adapter = await createDatabaseAdapterFromEnv();
  const runner = new MigrationRunner(adapter);

  try {
    const status = await runner.getStatus(seedMigrations);

    console.log(`📊 Seed Status:`);
    console.log(`   Applied: ${status.applied.length}`);
    console.log(`   Pending: ${status.pending.length}\n`);

    if (status.pending.length === 0) {
      console.log('✅ All seeds are up to date!');
      return;
    }

    await runner.runMigrations(seedMigrations);
    console.log('\n✅ Seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await adapter.close();
  }
}

// Run if executed directly
if (require.main === module) {
  void runSeeds();
}

export { runSeeds };
