/**
 * Application Configuration
 *
 * Centralized configuration management with environment variable validation.
 */

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  path?: string; // SQLite file path
  url?: string; // PostgreSQL connection string
}

export interface TelegramConfig {
  botToken: string;
}

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // cron format
  path: string;
}

export interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  database: DatabaseConfig;
  telegram: TelegramConfig;
  backup: BackupConfig;
  version: string;
}

function getEnvVar(name: string, required = false, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (required && !value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value ?? '';
}

function validateNodeEnv(value: string): 'development' | 'production' | 'test' {
  if (value === 'development' || value === 'production' || value === 'test') {
    return value;
  }
  return 'development';
}

function validateDatabaseType(value: string): 'sqlite' | 'postgresql' {
  if (value === 'sqlite' || value === 'postgresql') {
    return value;
  }
  return 'sqlite';
}

export function loadConfig(): Config {
  const nodeEnv = validateNodeEnv(getEnvVar('NODE_ENV', false, 'development'));
  const databaseType = validateDatabaseType(getEnvVar('DATABASE_TYPE', false, 'sqlite'));

  // Validate required variables based on database type
  if (databaseType === 'postgresql') {
    getEnvVar('DATABASE_URL', true);
  }

  const config: Config = {
    nodeEnv,
    port: parseInt(getEnvVar('PORT', false, '3000'), 10),
    database: {
      type: databaseType,
      path: getEnvVar('DATABASE_PATH', false, '.data/invent-stock.db'),
      url: getEnvVar('DATABASE_URL', false),
    },
    telegram: {
      botToken: getEnvVar('TELEGRAM_BOT_TOKEN', true),
    },
    backup: {
      enabled: getEnvVar('BACKUP_ENABLED', false, 'false') === 'true',
      schedule: getEnvVar('BACKUP_SCHEDULE', false, '0 2 * * *'), // 2 AM daily
      path: getEnvVar('BACKUP_PATH', false, '.data/backups'),
    },
    version: process.env.npm_package_version ?? '1.0.0',
  };

  return config;
}

// Singleton config instance
export const config = loadConfig();

// Validate configuration on load
export function validateConfig(): void {
  if (!config.telegram.botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }

  if (config.database.type === 'postgresql' && !config.database.url) {
    throw new Error('DATABASE_URL is required when using PostgreSQL');
  }

  console.log('✅ Configuration validated');
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Database: ${config.database.type}`);
  console.log(`   Backup: ${config.backup.enabled ? 'enabled' : 'disabled'}`);
}
