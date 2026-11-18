# Contributing

Thanks for your interest in contributing! This guide explains how to run each tier of the application locally without Docker so you can iterate quickly on a single layer.

## Table of contents

- [Prerequisites](#prerequisites)
- [Running the database](#running-the-database)
- [Running the API tier](#running-the-api-tier)
- [Running the web tier](#running-the-web-tier)
- [Running database migrations](#running-database-migrations)
- [Running the full stack with Docker Compose](#running-the-full-stack-with-docker-compose)
- [Code style and pull requests](#code-style-and-pull-requests)

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Node.js | 22 | matches the API's `engines` field |
| npm | 10 | bundled with Node 22 |
| PostgreSQL | 17 | or use the Docker Compose `postgres` service |
| Docker + Compose | any recent | only needed for the full-stack workflow |

---

## Running the database

The easiest way to get a local PostgreSQL instance is to start just the database container:

```bash
docker compose up -d postgres
```

This starts PostgreSQL 17 on **port 5432** with the following default credentials (see `docker-compose.yml`):

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `app` |
| User | `app` |
| Password | `app` |

If you have PostgreSQL installed natively you can use that instead — just make sure a database named `app` exists and set `DATABASE_URL` accordingly (see below).

---

## Running database migrations

Migrations live in `src/db/migrations/` and use [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).

```bash
cd src/db
npm install

# Apply all pending migrations
DATABASE_URL=postgres://app:app@localhost:5432/app npm run migrate

# Roll back the last migration
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate down
```

You must run migrations at least once before starting the API.

---

## Running the API tier

The API is an Express 5 application located in `src/api/`. It uses Node's built-in `--watch` flag for automatic restarts during development.

```bash
cd src/api
npm install

# Start the development server (restarts on file changes)
DATABASE_URL=postgres://app:app@localhost:5432/app npm run dev
```

The API listens on **port 3001** by default. You can override this with the `PORT` environment variable.

### Available endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create a task (`{ "title": "..." }`) |
| PATCH | `/tasks/:id` | Update a task (`{ "completed": true }` or `{ "title": "..." }`) |

---

## Running the web tier

The frontend is a Next.js 16 application located in `src/web/`.

```bash
cd src/web
npm install

# Start the Next.js development server
npm run dev
```

The web app listens on **port 3000** by default. It expects the API to be available at `http://localhost:3001`; you can override this with the `API_URL` environment variable if your API is running elsewhere.

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running the full stack with Docker Compose

To run all four services (postgres, migrate, api, web) together:

```bash
docker compose up --build
```

See the [README](README.md) for full Docker Compose instructions.

---

## Code style and pull requests

1. **Fork** the repository and create a feature branch from `main`.
2. Make your changes, keeping commits focused and messages descriptive.
3. Ensure the tier(s) you touched start cleanly with the instructions above.
4. Open a pull request against `main` with a clear description of what changed and why.

There are no automated lint or test commands configured yet — just make sure the app runs. 🙂
