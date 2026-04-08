/**
 * Health Check Server
 *
 * Express server for health checks and monitoring endpoints.
 */

import { DatabaseAdapter } from '../../infrastructure/database/adapters/DatabaseAdapter';

// Dynamic import for express (optional for production)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let expressModule: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  expressModule = require('express');
} catch {
  console.log('⚠️  Express not installed, health check server will not be available');
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'connected' | 'disconnected';
    telegram: 'connected' | 'disconnected';
  };
}

export class HealthCheckServer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private app: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private server: any = null;
  private db: DatabaseAdapter;
  private telegramConnected = false;
  private startTime: number;
  private version: string;

  constructor(db: DatabaseAdapter, version = '1.0.0') {
    this.db = db;
    this.version = version;
    this.startTime = Date.now();

    if (expressModule) {
      this.app = expressModule();
      this.setupRoutes();
    }
  }

  private setupRoutes(): void {
    if (!this.app) return;

    // Health check endpoint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.get('/health', async (_req: any, res: any) => {
      const status = await this.getHealthStatus();
      const statusCode = status.status === 'ok' ? 200 : status.status === 'degraded' ? 503 : 500;
      res.status(statusCode).json(status);
    });

    // Ready check endpoint (lighter than health)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.get('/ready', async (_req: any, res: any) => {
      const dbConnected = this.db.isConnected();
      if (dbConnected) {
        res.status(200).json({ ready: true });
      } else {
        res.status(503).json({ ready: false });
      }
    });

    // Simple ping endpoint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.get('/ping', (_req: any, res: any) => {
      res.status(200).json({ pong: true });
    });

    // Metrics endpoint (basic)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.get('/metrics', (_req: any, res: any) => {
      res.status(200).json({
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        version: this.version,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private async getHealthStatus(): Promise<HealthStatus> {
    const dbConnected = this.db.isConnected();

    // Try a simple query to verify database is actually responsive
    let dbCheck: 'connected' | 'disconnected' = 'disconnected';
    if (dbConnected) {
      try {
        await this.db.queryOne('SELECT 1');
        dbCheck = 'connected';
      } catch {
        dbCheck = 'disconnected';
      }
    }

    const status: HealthStatus['status'] =
      dbCheck === 'connected' && this.telegramConnected
        ? 'ok'
        : dbCheck === 'connected' || this.telegramConnected
          ? 'degraded'
          : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: {
        database: dbCheck,
        telegram: this.telegramConnected ? 'connected' : 'disconnected',
      },
    };
  }

  /**
   * Set Telegram bot connection status.
   */
  setTelegramConnected(connected: boolean): void {
    this.telegramConnected = connected;
  }

  /**
   * Start the health check server.
   */
  async start(port: number): Promise<void> {
    if (!this.app) {
      console.log('⚠️  Express not available, health check server not started');
      return;
    }

    return new Promise(resolve => {
      this.server = this.app!.listen(port, () => {
        console.log(`✅ Health check server running on port ${port}`);
        console.log(`   Health: http://localhost:${port}/health`);
        console.log(`   Ready:  http://localhost:${port}/ready`);
        console.log(`   Ping:   http://localhost:${port}/ping`);
        resolve();
      });
    });
  }

  /**
   * Stop the health check server.
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise(resolve => {
        this.server!.close(() => {
          console.log('✅ Health check server stopped');
          resolve();
        });
      });
    }
  }
}
