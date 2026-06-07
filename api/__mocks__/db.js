'use strict';
/**
 * Manual mock for src/db.js
 * Jest swaps this in for all tests via jest.config.js moduleNameMapper.
 * Tests run without a real Postgres instance.
 */
const mockRelease = jest.fn();

const mockClient = {
  query:   jest.fn(),
  release: mockRelease,
};

const pool = {
  query:   jest.fn(),
  connect: jest.fn().mockResolvedValue(mockClient),
  on:      jest.fn(),
};

module.exports = { pool, mockClient, mockRelease };
