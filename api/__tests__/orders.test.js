'use strict';
const request  = require('supertest');
const app      = require('../src/index');
const { pool } = require('../__mocks__/db');

afterEach(() => jest.clearAllMocks());

const sampleOrder = {
  id: 1, product_id: 1, product_name: 'Widget A',
  quantity: 2, status: 'pending', created_at: new Date()
};

describe('GET /api/orders', () => {
  it('returns all orders', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleOrder] });
    const res = await request(app).get('/api/orders');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('filters by status when ?status= is provided', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleOrder] });
    const res = await request(app).get('/api/orders?status=pending');
    expect(res.statusCode).toBe(200);
    // Verify the query was called with status param
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE'),
      ['pending']
    );
  });
});

describe('GET /api/orders/:id', () => {
  it('returns a single order', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleOrder] });
    const res = await request(app).get('/api/orders/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 for unknown order id', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/orders/999');
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /api/orders/:id/status', () => {
  it('updates order status to shipped', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ ...sampleOrder, status: 'shipped' }]
    });
    const res = await request(app)
      .patch('/api/orders/1/status')
      .send({ status: 'shipped' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('shipped');
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(app)
      .patch('/api/orders/1/status')
      .send({ status: 'flying' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/must be one of/);
  });
});
