const db = require('../db');
const { Pool } = require('pg');

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Database Connection', () => {
  it('should create a Pool with DATABASE_URL from environment', () => {
    expect(Pool).toHaveBeenCalledWith({ 
      connectionString: process.env.DATABASE_URL 
    });
  });

  it('should export the pool instance', () => {
    expect(db).toBeDefined();
    expect(typeof db.query).toBe('function');
  });
});
