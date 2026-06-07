'use strict';
const request = require('supertest');
const app     = require('../src/index');
const { pool } = require('../__mocks__/db');

afterEach(() => jest.clearAllMocks());

describe('GET /health', () => {
  it('returns 200 with status ok and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('GET /health/db', () => {
  it('returns 200 when db responds', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    const res = await request(app).get('/health/db');
    expect(res.statusCode).toBe(200);
    expect(res.body.db).toBe('connected');
  });

  it('returns 503 when db is unreachable', async () => {
    pool.query.mockRejectedValueOnce(new Error('Connection refused'));
    const res = await request(app).get('/health/db');
    expect(res.statusCode).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.db).toMatch(/Connection refused/);
  });
});

describe('GET /unknown-route', () => {
  it('returns 404 for unknown paths', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.statusCode).toBe(404);
  });
});
