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

  it('returns 500 when orders cannot be fetched', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    pool.query.mockRejectedValueOnce(new Error('query failed'));

    const res = await request(app).get('/api/orders');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal server error');
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

  it('returns 500 when a single order cannot be fetched', async () => {
    pool.query.mockRejectedValueOnce(new Error('query failed'));

    const res = await request(app).get('/api/orders/1');

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal server error');
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

  it('returns 404 when updating an unknown order', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/orders/999/status')
      .send({ status: 'shipped' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Order not found');
  });

  it('returns 500 when status update fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('query failed'));

    const res = await request(app)
      .patch('/api/orders/1/status')
      .send({ status: 'shipped' });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});

describe('POST /api/orders', () => {
  it('creates an order', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Widget A', price: '10.00' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, product_id: 1, quantity: 2, total: '20.00', status: 'pending' }],
      });

    const res = await request(app)
      .post('/api/orders')
      .send({ productId: 1, quantity: 2 });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  it('returns 400 when create payload is invalid', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ productId: 1 });

    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when creating an order for an unknown product', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/orders')
      .send({ productId: 999, quantity: 1 });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });

  it('returns 500 when order creation fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    pool.query.mockRejectedValueOnce(new Error('query failed'));

    const res = await request(app)
      .post('/api/orders')
      .send({ productId: 1, quantity: 1 });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
