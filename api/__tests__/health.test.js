const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../__mocks__/db');

afterEach(() => jest.clearAllMocks());

describe('Health endpoints', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET /health/db should return 200 when DB is up', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ now: '2025-01-01T00:00:00Z' }],
    });

    const res = await request(app).get('/health/db');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health/db should return 503 when DB is down', async () => {
    pool.query.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/health/db');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
  });
});
