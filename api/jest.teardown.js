const { pool, mockClient } = require('./__mocks__/db');

afterEach(() => {
  jest.clearAllTimers();
});

afterAll(async () => {
  mockClient.release.mockClear();
  await pool.end();
  pool.removeAllListeners();
});
