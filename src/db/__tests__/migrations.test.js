'use strict';

/**
 * Migration tests
 *
 * These tests verify the structure and behaviour of each migration file by
 * providing a mock `pgm` object (node-pg-migrate's migration builder) and
 * asserting that the correct DDL helpers are called with the expected
 * arguments.  No real database connection is required.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal mock of node-pg-migrate's MigrationBuilder (pgm).
 * Each method is a jest spy so assertions can be made against calls.
 */
function makePgm() {
  return {
    createTable: jest.fn(),
    dropTable: jest.fn(),
    addColumn: jest.fn(),
    dropColumn: jest.fn(),
    addConstraint: jest.fn(),
    dropConstraint: jest.fn(),
    createIndex: jest.fn(),
    dropIndex: jest.fn(),
    sql: jest.fn(),
    func: jest.fn((expr) => expr), // returns the expression string unchanged
  };
}

// ---------------------------------------------------------------------------
// 1718500000000_initial-schema  (users table)
// ---------------------------------------------------------------------------

describe('migration: 1718500000000_initial-schema', () => {
  const migration = require('../migrations/1718500000000_initial-schema');

  it('exports an `up` function', () => {
    expect(typeof migration.up).toBe('function');
  });

  it('exports a `down` function', () => {
    expect(typeof migration.down).toBe('function');
  });

  describe('up()', () => {
    let pgm;

    beforeEach(() => {
      pgm = makePgm();
      migration.up(pgm);
    });

    it('creates the `users` table', () => {
      expect(pgm.createTable).toHaveBeenCalledTimes(1);
      expect(pgm.createTable).toHaveBeenCalledWith('users', expect.any(Object));
    });

    it('defines an `id` serial primary-key column', () => {
      const [, columns] = pgm.createTable.mock.calls[0];
      expect(columns.id).toMatchObject({ type: 'serial', primaryKey: true });
    });

    it('defines a non-null unique `email` varchar column', () => {
      const [, columns] = pgm.createTable.mock.calls[0];
      expect(columns.email).toMatchObject({
        type: 'varchar(255)',
        notNull: true,
        unique: true,
      });
    });

    it('defines a non-null `created_at` timestamp column with a default', () => {
      const [, columns] = pgm.createTable.mock.calls[0];
      expect(columns.created_at).toMatchObject({
        type: 'timestamp',
        notNull: true,
      });
      expect(columns.created_at.default).toBeDefined();
    });
  });

  describe('down()', () => {
    let pgm;

    beforeEach(() => {
      pgm = makePgm();
      migration.down(pgm);
    });

    it('drops the `users` table', () => {
      expect(pgm.dropTable).toHaveBeenCalledTimes(1);
      expect(pgm.dropTable).toHaveBeenCalledWith('users');
    });
  });
});

// ---------------------------------------------------------------------------
// 1718500001000_create-tasks  (tasks table)
// ---------------------------------------------------------------------------

describe('migration: 1718500001000_create-tasks', () => {
  const migration = require('../migrations/1718500001000_create-tasks');

  it('exports an `up` function', () => {
    expect(typeof migration.up).toBe('function');
  });

  it('exports a `down` function', () => {
    expect(typeof migration.down).toBe('function');
  });

  describe('up()', () => {
    let pgm;

    beforeEach(() => {
      pgm = makePgm();
      migration.up(pgm);
    });

    it('creates the `tasks` table', () => {
      expect(pgm.createTable).toHaveBeenCalledTimes(1);
      expect(pgm.createTable).toHaveBeenCalledWith('tasks', expect.any(Object));
    });

    it('defines an `id` serial primary-key column', () => {
      const [, columns] = pgm.createTable.mock.calls[0];
      expect(columns.id).toMatchObject({ type: 'serial', primaryKey: true });
    });

    it('defines a non-null `title` varchar(500) column', () => {
      const [, columns] = pgm.createTable.mock.calls[0];
      expect(columns.title).toMatchObject({
        type: 'varchar(500)',
        notNull: true,
      });
    });

    it('defines a non-null `completed` boolean column defaulting to false', () => {
      const [, columns] = pgm.createTable.mock.calls[0];
      expect(columns.completed).toMatchObject({
        type: 'boolean',
        notNull: true,
        default: false,
      });
    });

    it('defines a non-null `created_at` timestamp column with a default', () => {
      const [, columns] = pgm.createTable.mock.calls[0];
      expect(columns.created_at).toMatchObject({
        type: 'timestamp',
        notNull: true,
      });
      expect(columns.created_at.default).toBeDefined();
    });
  });

  describe('down()', () => {
    let pgm;

    beforeEach(() => {
      pgm = makePgm();
      migration.down(pgm);
    });

    it('drops the `tasks` table', () => {
      expect(pgm.dropTable).toHaveBeenCalledTimes(1);
      expect(pgm.dropTable).toHaveBeenCalledWith('tasks');
    });
  });
});

// ---------------------------------------------------------------------------
// Migration file naming / ordering
// ---------------------------------------------------------------------------

describe('migration file conventions', () => {
  const path = require('path');
  const fs = require('fs');

  const migrationsDir = path.resolve(__dirname, '../migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

  it('migration filenames start with a numeric timestamp', () => {
    for (const file of files) {
      expect(file).toMatch(/^\d+_/);
    }
  });

  it('migration files are ordered by timestamp (no duplicates)', () => {
    const timestamps = files.map((f) => Number(f.split('_')[0]));
    const unique = new Set(timestamps);
    expect(unique.size).toBe(timestamps.length);
  });

  it('every migration exports both `up` and `down`', () => {
    for (const file of files) {
      const mod = require(path.join(migrationsDir, file));
      expect(typeof mod.up).toBe('function');
      expect(typeof mod.down).toBe('function');
    }
  });

  it('initial-schema migration runs before create-tasks migration', () => {
    const timestamps = files.map((f) => Number(f.split('_')[0]));
    expect(timestamps[0]).toBeLessThan(timestamps[1]);
  });
});
