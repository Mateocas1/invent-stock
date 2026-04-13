/**
 * InventStock - Inventory Management Bot for Nail Salons
 *
 * Main entry point for the application.
 */

import 'dotenv/config';
import { config, validateConfig } from './config';
import { createDatabaseAdapterFromEnv } from './infrastructure/database/adapters';
import { DatabaseAdapter } from './infrastructure/database/adapters/DatabaseAdapter';
import { createRepositories } from './infrastructure/RepositoryFactory';
import { CommandQueue } from './application/queue/CommandQueue';
import { StockServiceImpl } from './application/services/StockService';
import { PredictionServiceImpl } from './application/services/PredictionService';
import { AlertServiceImpl } from './application/services/AlertService';
import { TelegramBotService } from './interfaces/telegram';
import { JobScheduler } from './jobs/JobScheduler';
import { HealthCheckServer } from './interfaces/http/HealthCheckServer';

async function main(): Promise<void> {
  console.log('🚀 InventStock starting...\n');

  let db: DatabaseAdapter | null = null;
  let bot: TelegramBotService | null = null;
  let healthServer: HealthCheckServer | null = null;
  let jobScheduler: JobScheduler | null = null;

  try {
    // Validate configuration
    validateConfig();
    console.log(`   Version: ${config.version}\n`);

    // Initialize database
    db = await createDatabaseAdapterFromEnv();
    console.log('✅ Database connected');
    console.log(`   Type: ${config.database.type}`);

    if (config.database.type === 'sqlite') {
      console.log(`   Path: ${config.database.path}`);
    }

    // Wait for database to be fully initialized
    let dbReady = false;
    let retries = 0;
    const maxRetries = 30; // ~5 minutes (30 retries * 10 seconds)
    let tableCount = 0;

    while (!dbReady && retries < maxRetries) {
      try {
        // Check if database has tables
        const result = await db.query<{ count: number }>(
          config.database.type === 'postgresql'
            ? "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
            : 'SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"',
        );
        tableCount = result[0]?.count ?? 0;

        // Verify migrations table exists and has data
        const migrationCheck = await db.query<{ count: number }>(
          'SELECT COUNT(*) as count FROM _migrations',
        );
        const migrationsApplied = (migrationCheck[0]?.count ?? 0) > 0;

        // Verify critical tables exist
        let productsExists = false,
          servicesExists = false;
        try {
          await db.query('SELECT 1 FROM products LIMIT 1');
          productsExists = true;
        } catch {} // Ignore errors - table might not exist yet

        try {
          await db.query('SELECT 1 FROM services LIMIT 1');
          servicesExists = true;
        } catch {} // Ignore errors

        if (migrationsApplied && productsExists && servicesExists && tableCount >= 6) {
          dbReady = true;
          console.log('✅ Database fully initialized');
        } else {
          throw new Error('Database not ready');
        }
      } catch (error) {
        retries++;
        const retryDelay = Math.min(10000 * retries, 60000); // Max 60 seconds delay
        console.log(`
🔁 Database not ready (${retries}/${maxRetries}) - retrying in ${retryDelay / 1000} seconds...`);
        console.log(` Tables found: ${tableCount}`);
        if (retries <= 3) {
          console.log(' If this persists, try resetting the database in Railway dashboard');
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    if (!dbReady) {
      throw new Error(
        '❌ Database initialization failed after maximum retries.\n' +
          'Try resetting the database in Railway dashboard.',
      );
    }

    console.log(`✅ Database ready with ${tableCount} tables`);

    // Initialize repositories
    const repos = createRepositories(db, config.database.type);
    console.log('✅ Repositories initialized');

    // Initialize command queue
    const commandQueue = new CommandQueue();
    console.log('✅ Command queue initialized');

    // Initialize prediction service
    const predictionService = new PredictionServiceImpl(repos.product, repos.consumption);
    console.log('✅ Prediction service initialized');

    // Initialize alert service
    const alertService = new AlertServiceImpl(repos.product, repos.alert, predictionService);
    console.log('✅ Alert service initialized');

    // Initialize stock service
    const stockService = new StockServiceImpl(
      db,
      repos.product,
      repos.service,
      repos.recipe,
      repos.transaction,
      repos.consumption,
      predictionService,
      alertService,
    );
    console.log('✅ Stock service initialized');

    // Verify seed data exists before starting bot
    try {
      const products = await repos.product.findAll();
      const services = await repos.service.findAll();

      if (products.length === 0 || services.length === 0) {
        console.log('⚠️ Seeding the database...');
        const adapterForSeeds = await createDatabaseAdapterFromEnv();
        const runnerForSeeds = new (
          await import('./infrastructure/database/migrations/MigrationRunner')
        ).MigrationRunner(adapterForSeeds);
        const seedMigrations = (await import('./infrastructure/database/seeds/seed-data'))
          .seedMigrations;

        await runnerForSeeds.runMigrations(seedMigrations);
        await adapterForSeeds.close();
        console.log('✅ Seed data loaded');
      }
    } catch (error) {
      console.log('⚠️ Running seeds because tables were empty...');
      const adapterForSeeds = await createDatabaseAdapterFromEnv();
      const runnerForSeeds = new (
        await import('./infrastructure/database/migrations/MigrationRunner')
      ).MigrationRunner(adapterForSeeds);
      const seedMigrations = (await import('./infrastructure/database/seeds/seed-data'))
        .seedMigrations;

      await runnerForSeeds.runMigrations(seedMigrations);
      await adapterForSeeds.close();
      console.log('✅ Seed data loaded');
    }

    // Initialize Telegram bot
    bot = new TelegramBotService({
      token: config.telegram.botToken,
      commandQueue,
      stockService,
      alertService,
      predictionService,
      productRepo: repos.product,
      serviceRepo: repos.service,
    });
    console.log('✅ Telegram bot initialized');

    // Initialize health check server
    healthServer = new HealthCheckServer(db, config.version);
    await healthServer.start(config.port);
    healthServer.setTelegramConnected(true);

    // Initialize job scheduler (backups)
    jobScheduler = new JobScheduler(db, config.backup, config.version);
    jobScheduler.start();

    console.log('\n🎉 InventStock is running!');
    console.log('   Press Ctrl+C to stop\n');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      if (jobScheduler) {
        jobScheduler.stop();
      }
      if (healthServer) {
        await healthServer.stop();
      }
      if (bot) {
        await bot.stop();
      }
      if (db) {
        await db.close();
      }
      console.log('👋 Goodbye!');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n🛑 Shutting down gracefully...');
      if (jobScheduler) {
        jobScheduler.stop();
      }
      if (healthServer) {
        await healthServer.stop();
      }
      if (bot) {
        await bot.stop();
      }
      if (db) {
        await db.close();
      }
      console.log('👋 Goodbye!');
      process.exit(0);
    });

    // Keep the process running
    await new Promise(() => {
      // Infinite promise to keep the process alive
    });
  } catch (error) {
    console.error('\n❌ Failed to start InventStock:', error);

    // Cleanup on error
    if (jobScheduler) {
      jobScheduler.stop();
    }
    if (healthServer) {
      await healthServer.stop();
    }
    if (bot) {
      await bot.stop();
    }
    if (db) {
      await db.close();
    }

    process.exit(1);
  }
}

// Run main function
void main();
