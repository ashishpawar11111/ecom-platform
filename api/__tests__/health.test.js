const request = require('supertest');

jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

const { Pool } = require('pg');
const mockPool = new Pool();
const app = require('../src/index');

describe('Health endpoints', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET /health/db should return 200 when DB is up', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ now: '2025-01-01T00:00:00Z' }],
    });

    const res = await request(app).get('/health/db');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health/db should return 503 when DB is down', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/health/db');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
  });
});
