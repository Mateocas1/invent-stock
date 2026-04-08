import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { config } from '../config';

describe('Production Smoke Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || `http://localhost:${config.port}`;

  describe('Health Check Endpoints', () => {
    it('GET /health should return 200 OK', async () => {
      const response = await fetch(`${baseUrl}/health`);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('checks');
    });

    it('GET /ready should return 200 when database is connected', async () => {
      const response = await fetch(`${baseUrl}/ready`);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.ready).toBe(true);
    });

    it('GET /ping should return 200', async () => {
      const response = await fetch(`${baseUrl}/ping`);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.pong).toBe(true);
    });

    it('GET /metrics should return uptime and version', async () => {
      const response = await fetch(`${baseUrl}/metrics`);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('uptime');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('timestamp');
    });
  });

  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      expect(config.telegram.botToken).toBeDefined();
      expect(config.telegram.botToken.length).toBeGreaterThan(0);
    });

    it('should have valid database configuration', () => {
      expect(['sqlite', 'postgresql']).toContain(config.database.type);

      if (config.database.type === 'sqlite') {
        expect(config.database.path).toBeDefined();
      } else {
        expect(config.database.url).toBeDefined();
      }
    });
  });

  describe('Health Status Checks', () => {
    it('should report database as connected', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();

      expect(body.checks.database).toBe('connected');
    });

    it('should have a valid status value', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();

      expect(['ok', 'degraded', 'error']).toContain(body.status);
    });

    it('should report positive uptime', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();

      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});

// Manual smoke test runner for production
describe('Manual Production Tests', () => {
  it('can connect to database', async () => {
    // This test verifies database connectivity through the health endpoint
    const response = await fetch(
      `${process.env.TEST_BASE_URL || `http://localhost:${config.port}`}/health`,
    );
    expect(response.ok).toBe(true);
  });
});
