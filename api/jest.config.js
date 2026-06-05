module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      lines:      75,
      functions:  75,
      branches:   60,
      statements: 75
    }
  },
  coverageReporters: ['text', 'lcov'],
  // mock pg so tests don't need a real database
  moduleNameMapper: {
    '^../db$': '<rootDir>/__mocks__/db.js'
  }
};