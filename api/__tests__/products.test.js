'use strict';
const request   = require('supertest');
const app       = require('../src/index');
const { pool, mockClient } = require('../__mocks__/db');

afterEach(() => jest.clearAllMocks());

describe('GET /api/products', () => {
  it('returns a list of products', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, name: 'Widget A', price: '9.99',  stock: 100, created_at: new Date() },
        { id: 2, name: 'Widget B', price: '19.99', stock: 50,  created_at: new Date() },
      ]
    });
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('Widget A');
  });

  it('returns empty array when no products exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/products/:id', () => {
  it('returns single product when found', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Widget A', price: '9.99', stock: 100 }]
    });
    const res = await request(app).get('/api/products/1');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 when product does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/products/999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });
});

describe('POST /api/products/order', () => {
  it('returns 201 and order details when stock is sufficient', async () => {
    // pool.connect() → mockClient
    // mockClient.query calls: BEGIN, UPDATE (returns row), INSERT, COMMIT
    mockClient.query
      .mockResolvedValueOnce({})                                           // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Widget A', stock: 99 }] }) // UPDATE
      .mockResolvedValueOnce({ rows: [{ id: 1, product_id: 1, quantity: 1, status: 'pending', created_at: new Date() }] }) // INSERT
      .mockResolvedValueOnce({});                                          // COMMIT

    const res = await request(app)
      .post('/api/products/order')
      .send({ product_id: 1, quantity: 1 });

    expect(res.statusCode).toBe(201);
    expect(res.body.order.status).toBe('pending');
    expect(res.body.product.stock).toBe(99);
  });

  it('returns 400 when stock is insufficient', async () => {
    mockClient.query
      .mockResolvedValueOnce({})       // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // UPDATE returns nothing = no stock
      .mockResolvedValueOnce({});      // ROLLBACK

    const res = await request(app)
      .post('/api/products/order')
      .send({ product_id: 1, quantity: 9999 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Insufficient stock');
  });

  it('returns 400 when product_id is missing', async () => {
    const res = await request(app)
      .post('/api/products/order')
      .send({ quantity: 1 });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when quantity is zero', async () => {
    const res = await request(app)
      .post('/api/products/order')
      .send({ product_id: 1, quantity: 0 });
    expect(res.statusCode).toBe(400);
  });
});
