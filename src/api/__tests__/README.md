# API Tests

This directory contains unit tests for the Express API.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- `app.test.js` - Tests for all API endpoints (GET /health, GET /tasks, POST /tasks, PATCH /tasks/:id)
- `db.test.js` - Tests for database connection module

## Coverage

Current test coverage: **100%** (statements, branches, functions, lines)

## Test Approach

- Uses **Jest** as the test framework
- Uses **supertest** for HTTP assertions
- Mocks the database layer to avoid external dependencies
- Tests cover:
  - Happy path scenarios
  - Input validation
  - Error handling
  - Edge cases (empty strings, whitespace, invalid IDs)
  - Database error scenarios

## Adding New Tests

When adding new endpoints or modifying existing ones:

1. Add corresponding test cases in `app.test.js`
2. Mock database responses using `jest.mock('../db')`
3. Test both success and error scenarios
4. Verify input validation
5. Run `npm run test:coverage` to ensure coverage remains at 100%
