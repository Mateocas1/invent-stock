/**
 * Backup Job
 *
 * Scheduled job to export database data to JSON for backup purposes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseAdapter } from '../infrastructure/database/adapters/DatabaseAdapter';

export interface BackupData {
  timestamp: string;
  version: string;
  tables: {
    products: unknown[];
    services: unknown[];
    recipes: unknown[];
    inventory_transactions: unknown[];
    consumption_history: unknown[];
    stock_alerts: unknown[];
  };
}

export class BackupJob {
  private db: DatabaseAdapter;
  private backupPath: string;
  private version: string;

  constructor(db: DatabaseAdapter, backupPath: string, version = '1.0.0') {
    this.db = db;
    this.backupPath = backupPath;
    this.version = version;
  }

  /**
   * Run a backup immediately.
   */
  async run(): Promise<string> {
    console.log('📦 Starting database backup...');

    // Ensure backup directory exists
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(this.backupPath, filename);

    // Export all tables
    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      version: this.version,
      tables: {
        products: await this.db.query('SELECT * FROM products'),
        services: await this.db.query('SELECT * FROM services'),
        recipes: await this.db.query('SELECT * FROM recipes'),
        inventory_transactions: await this.db.query('SELECT * FROM inventory_transactions'),
        consumption_history: await this.db.query('SELECT * FROM consumption_history'),
        stock_alerts: await this.db.query('SELECT * FROM stock_alerts'),
      },
    };

    // Write to file
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    console.log(`✅ Backup completed: ${filepath}`);
    console.log(`   Products: ${backupData.tables.products.length}`);
    console.log(`   Services: ${backupData.tables.services.length}`);
    console.log(`   Recipes: ${backupData.tables.recipes.length}`);
    console.log(`   Transactions: ${backupData.tables.inventory_transactions.length}`);
    console.log(`   Consumption: ${backupData.tables.consumption_history.length}`);
    console.log(`   Alerts: ${backupData.tables.stock_alerts.length}`);

    return filepath;
  }

  /**
   * Clean up old backups, keeping only the most recent N backups.
   */
  async cleanup(maxBackups = 7): Promise<void> {
    if (!fs.existsSync(this.backupPath)) {
      return;
    }

    const files = fs
      .readdirSync(this.backupPath)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(this.backupPath, f),
        stat: fs.statSync(path.join(this.backupPath, f)),
      }))
      .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

    // Delete old backups
    const toDelete = files.slice(maxBackups);
    for (const file of toDelete) {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Deleted old backup: ${file.name}`);
    }

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} old backups`);
    }
  }

  /**
   * List all available backups.
   */
  listBackups(): Array<{ name: string; size: number; created: Date }> {
    if (!fs.existsSync(this.backupPath)) {
      return [];
    }

    return fs
      .readdirSync(this.backupPath)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => {
        const stat = fs.statSync(path.join(this.backupPath, f));
        return {
          name: f,
          size: stat.size,
          created: stat.mtime,
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  /**
   * Restore from a backup file.
   */
  async restore(backupFile: string): Promise<void> {
    const filepath = path.join(this.backupPath, backupFile);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    console.log(`📂 Restoring from backup: ${backupFile}`);

    const backupData: BackupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    // Note: This is a simplified restore that just shows what would be restored.
    // In a real implementation, you'd truncate tables and re-insert data.
    console.log('⚠️  Restore functionality would restore:');
    console.log(`   Products: ${backupData.tables.products.length}`);
    console.log(`   Services: ${backupData.tables.services.length}`);
    console.log(`   Recipes: ${backupData.tables.recipes.length}`);
    console.log(`   Transactions: ${backupData.tables.inventory_transactions.length}`);
    console.log(`   Consumption: ${backupData.tables.consumption_history.length}`);
    console.log(`   Alerts: ${backupData.tables.stock_alerts.length}`);
    console.log('⚠️  Full restore not implemented - use with caution');
  }
}
