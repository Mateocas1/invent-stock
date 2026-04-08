/**
 * Manual Backup Script
 *
 * Run this script to create a manual backup.
 * Usage: npm run backup
 */

import 'dotenv/config';
import { config } from '../config';
import { createDatabaseAdapterFromEnv } from '../infrastructure/database/adapters';
import { BackupJob } from '../jobs/BackupJob';

async function runBackup(): Promise<void> {
  console.log('📦 Running manual backup...\n');

  if (!config.backup.enabled) {
    console.log('⚠️  Backup is disabled in configuration.');
    console.log('   Set BACKUP_ENABLED=true in your .env file');
    process.exit(1);
  }

  const db = await createDatabaseAdapterFromEnv();
  const backupJob = new BackupJob(db, config.backup.path, config.version);

  try {
    const filepath = await backupJob.run();
    await backupJob.cleanup(7); // Keep last 7 backups
    console.log(`\n✅ Backup completed: ${filepath}`);
  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

void runBackup();
