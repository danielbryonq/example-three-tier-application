// Test that db.js creates a pg Pool with the DATABASE_URL env variable.
// We mock the 'pg' module to avoid needing a real database connection.

const mockPool = { query: jest.fn() };
const MockPool = jest.fn(() => mockPool);

jest.mock('pg', () => ({
  Pool: MockPool,
}));

describe('db', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    // Reset module registry so db.js is re-evaluated fresh each test
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('creates a Pool with the DATABASE_URL connection string', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

    // Re-require after setting env and resetting modules
    const { Pool } = require('pg');
    Pool.mockImplementation(() => mockPool);

    require('../db');

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgresql://user:pass@localhost:5432/testdb',
    });
  });

  it('exports the pool instance', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

    const { Pool } = require('pg');
    Pool.mockImplementation(() => mockPool);

    const pool = require('../db');

    expect(pool).toBe(mockPool);
  });

  it('passes undefined connectionString when DATABASE_URL is not set', () => {
    delete process.env.DATABASE_URL;

    const { Pool } = require('pg');
    Pool.mockImplementation(() => mockPool);

    require('../db');

    expect(Pool).toHaveBeenCalledWith({
      connectionString: undefined,
    });
  });
});
