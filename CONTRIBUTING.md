# Contributing

Thanks for your interest in contributing! This guide covers how to run the project locally and how to submit changes.

## Running locally

**Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin).

```bash
# Clone the repo
git clone https://github.com/danielbryonq/example-three-tier-application.git
cd example-three-tier-application

# Build images and start all four services
docker compose up --build
```

Docker Compose starts the services in dependency order:

| # | Service | What it does |
|---|---------|--------------|
| 1 | `postgres` | PostgreSQL 17 database |
| 2 | `migrate` | Applies `node-pg-migrate` migrations, then exits |
| 3 | `api` | Express REST API (internal port 3001) |
| 4 | `web` | Next.js frontend at <http://localhost:3000> |

Open <http://localhost:3000> once the stack is up.

```bash
# Stop (keeps data volume)
docker compose down

# Stop and delete all data
docker compose down -v

# Rebuild after any code change
docker compose up --build
```

## Project layout

```
src/
├── api/            # Express REST API (src/api/index.js)
├── db/             # node-pg-migrate migrations (src/db/migrations/)
├── web/            # Next.js frontend (src/web/app/)
└── infrastructure/ # Terraform for GCP deployment
```

## Making changes

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-change
   ```
2. **Make your changes.** A few conventions to follow:
   - Never edit existing migration files — add a new one instead.
   - Pass all configuration through environment variables (no hardcoded values).
   - Match **Node 22** and **PostgreSQL 17** in any new Dockerfiles or dependencies.
3. **Test locally** with `docker compose up --build` and verify the app works at <http://localhost:3000>.
4. **Commit** with a short, descriptive message:
   ```bash
   git commit -m "feat: add due_date column to tasks"
   ```
5. **Push** your branch and open a Pull Request against `main`. Describe what you changed and why, and include any manual testing steps you followed.

## Questions?

Open a GitHub Issue or start a Discussion — we're happy to help.
