'use strict';

// Manual Jest mock for the pg pool (db.js)
const db = {
  query: jest.fn(),
};

module.exports = db;
