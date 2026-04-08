# InventStock

Inventory Management Bot for Nail Salons

## Overview

InventStock is a Telegram bot designed to help nail salons manage their inventory. It tracks product consumption, generates alerts for low stock, and provides usage statistics.

## Features

- 📦 Product inventory management
- 💅 Service-based consumption tracking
- ⚠️ Automated stock alerts
- 📊 Usage reports and statistics
- 🤖 Telegram Bot integration

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Databases**: SQLite (dev) / PostgreSQL (prod)
- **Bot API**: node-telegram-bot-api
- **Deployment**: Railway

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Add your Telegram Bot Token to TELEGRAM_BOT_TOKEN
```

### Database Setup

```bash
# Run migrations to create tables
npm run migrate

# Seed initial data (products and services)
npm run seed
```

### Development

```bash
# Run in development mode
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

## Project Structure

```
src/
├── domain/
│   ├── entities/           # Domain entities (Product, Service, etc.)
│   └── repositories/       # Repository interfaces
├── infrastructure/
│   ├── database/
│   │   ├── adapters/       # Database adapters (SQLite, PostgreSQL)
│   │   ├── migrations/     # Database migrations
│   │   └── seeds/          # Seed data
│   └── repositories/       # Repository implementations
├── application/
│   ├── services/           # Business logic services
│   └── use-cases/          # Application use cases
└── interfaces/
    └── telegram/           # Telegram bot handlers
```

## Database Schema

The system uses 6 main tables:

1. **products** - Inventory items
2. **services** - Salon services
3. **recipes** - Service-product relationships
4. **inventory_transactions** - Stock change history
5. **consumption_history** - Service consumption records
6. **stock_alerts** - Alert notifications

## Environment Variables

| Variable             | Description                              | Default                   |
| -------------------- | ---------------------------------------- | ------------------------- |
| `NODE_ENV`           | Environment mode                         | `development`             |
| `DB_TYPE`            | Database type (`sqlite` or `postgresql`) | `sqlite`                  |
| `SQLITE_PATH`        | SQLite database file path                | `./.data/invent-stock.db` |
| `DATABASE_URL`       | PostgreSQL connection string             | -                         |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather                | -                         |
| `LOG_LEVEL`          | Logging level                            | `info`                    |

## License

MIT
