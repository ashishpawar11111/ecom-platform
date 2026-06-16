'use strict';
module.exports = {
  rootDir:         '.',
  roots:           ['<rootDir>'],
  testEnvironment: 'node',
  testMatch:       ['**/__tests__/**/*.test.js'],
  // Exclude db.js from coverage — it needs a real Postgres connection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/db.js',
    '!src/telemetry.js',
    '!src/services/**/*.js',
  ],
  moduleNameMapper: {
    '^../db$': '<rootDir>/__mocks__/db.js',
    '^./db$':  '<rootDir>/__mocks__/db.js',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.teardown.js'],
  coverageThreshold: {
    global: {
      lines:      80,
      functions:  80,
      branches:   70,
      statements: 80,
    }
  },
  coverageReporters: ['text', 'lcov'],
  verbose: true,
};
