# Testing Guide

This document describes the test setup for all three tiers of the application, explains how to run and extend the tests, and sets out coverage targets and best practices.

---

## Table of contents

1. [Overview](#overview)
2. [Running the tests](#running-the-tests)
3. [API tier tests](#api-tier-tests)
4. [Web tier tests](#web-tier-tests)
5. [Database migration tests](#database-migration-tests)
6. [CI — GitHub Actions](#ci--github-actions)
7. [Adding new tests](#adding-new-tests)
8. [Coverage targets](#coverage-targets)
9. [Best practices](#best-practices)

---

## Overview

Each tier is tested independently with its own Jest configuration. No running database, API server, or browser is needed — all I/O is mocked at the unit-test level.

| Tier | Directory | Test framework | Test files |
|------|-----------|----------------|------------|
| API | `src/api/` | Jest 29 + supertest | `src/api/__tests__/` |
| Web | `src/web/` | Jest 29 + React Testing Library | `src/web/app/__tests__/` |
| DB migrations | `src/db/` | Jest 29 | `src/db/__tests__/` |

---

## Running the tests

### Prerequisites

Each tier manages its own `node_modules`. Install dependencies before running tests:

```bash
# API
cd src/api && npm install

# Web
cd src/web && npm install

# DB
cd src/db && npm install
```

### Run tests for one tier

```bash
# From the tier's directory
npm test

# With a coverage report
npm run test:coverage
```

### Run tests for all tiers from the repo root

```bash
(cd src/api && npm test) && \
(cd src/web && npm test) && \
(cd src/db  && npm test)
```

### Watch mode (re-runs on file save)

```bash
npx jest --watch        # from inside a tier directory
```

---

## API tier tests

**Location:** `src/api/__tests__/`  
**Config:** `src/api/jest.config.js`  
**Dependencies:** `jest`, `supertest`

### Test files

| File | What it tests |
|------|--------------|
| `index.test.js` | All four HTTP endpoints via supertest |
| `db.test.js` | pg `Pool` creation with the correct `DATABASE_URL` |

### Endpoint coverage

| Method | Path | Scenarios tested |
|--------|------|-----------------|
| GET | `/health` | Returns `{ status: "ok" }` with HTTP 200 |
| GET | `/tasks` | Empty list; list with tasks; DB error → 500 |
| POST | `/tasks` | Creates task; missing `title` → 400; DB error → 500 |
| PATCH | `/tasks/:id` | Updates task; task not found → 404; DB error → 500 |

### How the database is mocked

`src/api/db.js` exports a pg `Pool`. In tests it is replaced with a Jest manual mock:

```js
jest.mock('../db', () => ({
  query: jest.fn(),
}));
```

Each test sets `db.query.mockResolvedValueOnce(...)` to control what the pool returns without hitting a real database.

### Running API tests

```bash
cd src/api
npm test                 # all tests, single run
npm run test:coverage    # with Istanbul coverage report
```

---

## Web tier tests

**Location:** `src/web/app/__tests__/`  
**Config:** `src/web/jest.config.js`  
**Dependencies:** `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`

### Test files

| File | What it tests |
|------|--------------|
| `actions.test.ts` | Server actions: `getTasks`, `createTask`, `toggleTask` |
| `page.test.tsx` | `Home` server component rendering |

### Server action coverage (`actions.test.ts`)

- **`getTasks`** — calls the correct API URL; returns parsed JSON; handles empty list; propagates fetch errors.
- **`createTask`** — sends a POST with `{ title }` in the body; calls `revalidatePath("/")` after success.
- **`toggleTask`** — sends a PATCH with `{ completed }` to `/tasks/:id`; handles both `true` and `false`; calls `revalidatePath("/")`.

The global `fetch` and `next/cache`'s `revalidatePath` are both mocked with `jest.fn()`.

### Page component coverage (`page.test.tsx`)

- Renders the page heading.
- Shows an "No tasks yet" empty-state message when there are no tasks.
- Shows a task counter badge when tasks exist.
- Renders each task title.
- Renders the new-task form with a text input and submit button.
- Renders toggle buttons with the correct `aria-label` for completed and incomplete tasks.

The `./actions` module is mocked with `jest.mock` so the component can be rendered synchronously.

### How async Server Components are tested

Next.js Server Components are `async` functions. React Testing Library's `render` does not await them out of the box. The test awaits the component call directly, then passes the resolved JSX to `render`:

```tsx
const ui = await Home();
render(ui);
```

### Running web tests

```bash
cd src/web
npm test                 # all tests, single run
npm run test:coverage    # with Istanbul coverage report
```

---

## Database migration tests

**Location:** `src/db/__tests__/`  
**Config:** `src/db/jest.config.js`  
**Dependencies:** `jest`

### Test file

| File | What it tests |
|------|--------------|
| `migrations.test.js` | Both migration files — exports, column definitions, naming conventions |

### What is verified

Each migration file exports two functions — `up` and `down` — that receive a `pgm` (pg-migrate) object. The tests mock `pgm` and assert that:

- `up` calls `pgm.createTable` with the correct table name.
- The expected columns are present (names, types, `notNull`, `primaryKey`, `default` values).
- `down` calls `pgm.dropTable` with the same table name.
- Migration filenames follow the `YYYYMMDDHHMMSS_<slug>.js` naming convention and are ordered chronologically.

No real database connection is required.

### Migrations covered

| File | Table created |
|------|--------------|
| `*_initial-schema.js` | `users` |
| `*_create-tasks.js` | `tasks` |

### Running DB tests

```bash
cd src/db
npm test                 # all tests, single run
npm run test:coverage    # with Istanbul coverage report
```

---

## CI — GitHub Actions

The workflow file is at `.github/workflows/test.yml`.

It runs on **every push and pull request** to any branch. The three test jobs (`test-api`, `test-web`, `test-db`) run in parallel, each:

1. Checking out the code.
2. Setting up Node.js 22 with npm caching.
3. Running `npm ci` to install dependencies.
4. Running `npm test`.
5. Running `npm run test:coverage` to generate the coverage report.

The deploy workflow (`.github/workflows/deploy.yml`) only triggers on pushes to `main`, so tests always run before a deployment.

---

## Adding new tests

### Adding an API test

1. Open (or create) a file in `src/api/__tests__/`.
2. Import the app and the db mock:

   ```js
   const request = require('supertest');
   const app = require('../index');
   const db = require('../db');

   jest.mock('../db', () => ({ query: jest.fn() }));
   ```

3. Write your `describe`/`it` blocks. Use `db.query.mockResolvedValueOnce(...)` to control DB responses.

### Adding a web test

1. Open (or create) a file in `src/web/app/__tests__/`.
2. Mock any server actions or fetch calls your component uses:

   ```ts
   jest.mock('../actions', () => ({
     getTasks: jest.fn(),
     // ...
   }));
   ```

3. For async Server Components, await the component before passing to `render`:

   ```tsx
   const ui = await MyComponent({ prop: 'value' });
   render(ui);
   ```

### Adding a migration test

1. Create the migration file in `src/db/migrations/` following the `YYYYMMDDHHMMSS_<slug>.js` naming convention.
2. Add a `describe` block to `src/db/__tests__/migrations.test.js` (or a new file).
3. `require` the migration, construct a mock `pgm`, call `up(pgm, {})` and assert that `pgm.createTable` was called with the expected arguments.

---

## Coverage targets

| Tier | Target (lines) | Target (branches) |
|------|---------------|-------------------|
| API | ≥ 80 % | ≥ 75 % |
| Web | ≥ 80 % | ≥ 75 % |
| DB migrations | ≥ 90 % | ≥ 85 % |

These are aspirational targets. Coverage thresholds are not currently enforced automatically, but can be added to `jest.config.js` under the `coverageThreshold` key:

```js
coverageThreshold: {
  global: {
    lines: 80,
    branches: 75,
  },
},
```

---

## Best practices

- **Keep tests independent.** Each test should set up its own mocks and not rely on order of execution.
- **Mock at the boundary.** Mock the `db` module in API tests and the `fetch` global in web tests — not internal implementation details.
- **Use descriptive test names.** The test name should read as a plain-English sentence: *"returns 400 when title is missing"*.
- **Don't test the framework.** There is no value in asserting that Express parses JSON or that React renders HTML — test your application logic only.
- **Test unhappy paths.** Each endpoint and action should have at least one test for a failure scenario (missing input, DB error, not found).
- **Keep mocks close to the test.** Define `mockResolvedValueOnce` / `mockReturnValueOnce` inside the individual `it` block, not in a shared `beforeEach`, unless the value is truly common to all tests in the suite.
