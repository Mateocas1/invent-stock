/**
 * Scheduled Job Runner
 *
 * Manages scheduled jobs like backups using node-cron.
 */

import { BackupJob } from './BackupJob';
import { DatabaseAdapter } from '../infrastructure/database/adapters/DatabaseAdapter';

// Dynamic import for node-cron (optional dependency)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cron: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cron = require('node-cron');
} catch {
  console.log('⚠️  node-cron not installed, scheduled jobs will not run');
}

export class JobScheduler {
  private backupJob: BackupJob | null = null;
  private backupSchedule: string | null = null;
  private tasks: Array<{ stop: () => void }> = [];

  constructor(
    db: DatabaseAdapter,
    backupConfig: { enabled: boolean; schedule: string; path: string },
    version?: string,
  ) {
    if (backupConfig.enabled) {
      this.backupJob = new BackupJob(db, backupConfig.path, version);
      this.backupSchedule = backupConfig.schedule;
    }
  }

  /**
   * Start all scheduled jobs.
   */
  start(): void {
    if (!cron) {
      console.log('⏭️  Cron not available, skipping scheduled jobs');
      return;
    }

    // Start backup job
    if (this.backupJob && this.backupSchedule) {
      console.log(`📅 Scheduling backup job: ${this.backupSchedule}`);

      const task = cron.schedule(this.backupSchedule, async () => {
        try {
          await this.backupJob!.run();
          await this.backupJob!.cleanup();
        } catch (error) {
          console.error('❌ Backup job failed:', error);
        }
      });

      this.tasks.push(task);
      console.log('✅ Backup job scheduled');
    }
  }

  /**
   * Stop all scheduled jobs.
   */
  stop(): void {
    console.log('🛑 Stopping scheduled jobs...');
    for (const task of this.tasks) {
      task.stop();
    }
    this.tasks = [];
    console.log('✅ All jobs stopped');
  }

  /**
   * Run backup immediately (manual trigger).
   */
  async runBackupNow(): Promise<string | null> {
    if (!this.backupJob) {
      throw new Error('Backup job not configured');
    }
    const filepath = await this.backupJob.run();
    await this.backupJob.cleanup();
    return filepath;
  }

  /**
   * Get backup job instance.
   */
  getBackupJob(): BackupJob | null {
    return this.backupJob;
  }
}
