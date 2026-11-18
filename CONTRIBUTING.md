# Contributing

Thanks for your interest in contributing! This guide explains how to run each tier of the application locally without Docker so you can iterate quickly on a single layer.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22+ | All three tiers |
| npm | 10+ | Comes with Node |
| PostgreSQL | 17 | Running locally or via Docker |

A quick way to spin up only PostgreSQL (while running the other tiers natively) is:

```bash
docker compose up postgres --wait
```

This starts the database on `localhost:5432` with the credentials defined in `docker-compose.yml` (`app`/`app`, database `app`).

---

## 1 — Database tier (`src/db/`)

Migrations are managed with [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).

```bash
cd src/db
npm install

# Apply all pending migrations
DATABASE_URL=postgres://app:app@localhost:5432/app npm run migrate

# Roll back the last migration
DATABASE_URL=postgres://app:app@localhost:5432/app npm run migrate:down
```

Migration files live in `src/db/migrations/`. Add a new file there for each schema change.

---

## 2 — API tier (`src/api/`)

An Express 5 REST API that connects to PostgreSQL via `DATABASE_URL`.

```bash
cd src/api
npm install

# Start with file-watching (restarts on save)
DATABASE_URL=postgres://app:app@localhost:5432/app npm run dev
```

The API listens on **http://localhost:3001**.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create a task (`{ "title": "..." }`) |
| PATCH | `/tasks/:id` | Update a task (`{ "completed": true }` or `{ "title": "..." }`) |

> **Note:** `npm run dev` uses `node --watch`, which requires Node 18+.

---

## 3 — Web tier (`src/web/`)

A Next.js 16 / React 19 frontend that calls the API.

```bash
cd src/web
npm install

# Start the Next.js dev server (hot-reload enabled)
npm run dev
```

The dev server listens on **http://localhost:3000**.

By default the web app expects the API at `http://localhost:3001`. If you need to point it at a different host, set the `API_URL` environment variable before starting:

```bash
API_URL=http://localhost:3001 npm run dev
```

Other useful commands:

```bash
npm run build   # production build
npm run lint    # run ESLint
```

---

## Running the full stack with Docker Compose

If you just want everything running together, see the **Running locally with Docker Compose** section in the [README](README.md).

---

## Code style

- **API / DB** — standard Node.js (CommonJS). Follow the existing patterns in `index.js` / `db.js`.
- **Web** — TypeScript + Tailwind CSS. Run `npm run lint` before opening a PR and fix any reported issues.

## Opening a pull request

1. Fork the repo and create a feature branch from `main`.
2. Make your changes and ensure each tier you touched starts cleanly with the commands above.
3. Open a PR with a short description of *what* changed and *why*.
