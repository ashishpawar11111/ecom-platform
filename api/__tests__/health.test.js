const request = require('supertest');
const app     = require('../src/index');
const { mockQuery } = require('../__mocks__/db');

afterEach(() => jest.clearAllMocks());

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /health/db', () => {
  it('returns 200 when db query succeeds', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ 1: 1 }] });
    const res = await request(app).get('/health/db');
    expect(res.statusCode).toBe(200);
    expect(res.body.db).toBe('connected');
  });

  // This test is critical — proves the readiness probe works correctly
  it('returns 503 when db query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection refused'));
    const res = await request(app).get('/health/db');

    expect(res.statusCode).toBe(503);

    expect(res.body.status).toBe('error');
  });
});