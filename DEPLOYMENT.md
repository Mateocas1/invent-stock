# InventStock - Production Deployment Guide

## Deployment to Railway

### Prerequisites

1. [Railway CLI](https://docs.railway.app/develop/cli) installed
2. Railway account connected to your GitHub
3. PostgreSQL database provisioned on Railway

### Step 1: Install Optional Dependencies

```bash
npm install express node-cron
```

### Step 2: Set Environment Variables on Railway

In your Railway project dashboard, add these variables:

```env
NODE_ENV=production
DATABASE_TYPE=postgresql
DATABASE_URL=${{Postgres.DATABASE_URL}}
TELEGRAM_BOT_TOKEN=your_bot_token_here
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_PATH=/app/.data/backups
PORT=3000
```

### Step 3: Deploy

```bash
# Login to Railway
railway login

# Link your project
railway link

# Deploy
railway up
```

Or connect your GitHub repo to Railway for automatic deployments.

## Environment Variables Reference

| Variable             | Required     | Default                 | Description                  |
| -------------------- | ------------ | ----------------------- | ---------------------------- |
| `NODE_ENV`           | No           | `development`           | Environment mode             |
| `PORT`               | No           | `3000`                  | HTTP server port             |
| `DATABASE_TYPE`      | No           | `sqlite`                | `sqlite` or `postgresql`     |
| `DATABASE_PATH`      | No           | `.data/invent-stock.db` | SQLite file path             |
| `DATABASE_URL`       | Yes (for PG) | -                       | PostgreSQL connection string |
| `TELEGRAM_BOT_TOKEN` | Yes          | -                       | Bot token from @BotFather    |
| `BACKUP_ENABLED`     | No           | `false`                 | Enable daily backups         |
| `BACKUP_SCHEDULE`    | No           | `0 2 * * *`             | Cron schedule (2 AM daily)   |
| `BACKUP_PATH`        | No           | `.data/backups`         | Backup storage path          |

## Health Check Endpoints

Once deployed, the following endpoints are available:

- `GET /health` - Full health status (database, telegram, uptime)
- `GET /ready` - Lightweight readiness check
- `GET /ping` - Simple ping/pong
- `GET /metrics` - Basic metrics (uptime, version)

## Running Smoke Tests

### Local Testing

```bash
# Start the app
npm run dev

# In another terminal, run smoke tests
npm run test:smoke
```

### Production Testing

```bash
npm run test:smoke -- --url=https://your-app.up.railway.app
```

## Manual Backup

```bash
# Create a manual backup
npm run backup
```

## Database Migration

```bash
# Run migrations (automatic on deploy)
npm run migrate
```

## Troubleshooting

### PostgreSQL Connection Issues

1. Verify `DATABASE_URL` is set correctly
2. Check Railway PostgreSQL plugin is provisioned
3. Ensure the database user has proper permissions

### Telegram Bot Not Responding

1. Verify `TELEGRAM_BOT_TOKEN` is correct
2. Check webhook isn't set (we use polling)
3. Look at Railway logs: `railway logs`

### Health Check Failing

1. Check `/health` endpoint manually
2. Verify database connection in logs
3. Ensure all services initialized properly

## Free Tier Limits (Railway)

- **Database**: 500MB storage
- **RAM**: 512MB
- **Bandwidth**: 100GB/month
- **CPU**: Shared

For a small nail salon, these limits should be sufficient.

## Backup & Restore

Backups are automatically created daily at 2 AM (configurable via `BACKUP_SCHEDULE`).

Backup files are stored as JSON in the `BACKUP_PATH` directory.

To download backups from Railway:

```bash
railway ssh
# Then inside the container:
cd /app/.data/backups
ls -la
```
