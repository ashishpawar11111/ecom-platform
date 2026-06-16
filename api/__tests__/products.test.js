const request = require('supertest');
const app = require('../src/index');
const { pool, mockClient } = require('../__mocks__/db');

describe('GET /api/products', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns products', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Widget', price: '10.00', stock: 5 }],
    });

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 500 when products cannot be fetched', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    pool.query.mockRejectedValueOnce(new Error('database unavailable'));

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});

describe('POST /api/products/order', () => {
  beforeEach(() => {
    pool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns 400 for invalid order payload', async () => {
    const res = await request(app)
      .post('/api/products/order')
      .send({ productId: 1, quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid productId or quantity');
  });

  it('should place an order and decrement stock', async () => {
    // BEGIN
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({   // SELECT FOR UPDATE
        rows: [{ id: 1, name: 'Widget', price: 10.00, stock: 50 }],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE stock
      .mockResolvedValueOnce({   // INSERT order
        rows: [{ id: 1, product_id: 1, quantity: 2, total: 20.00, status: 'confirmed' }],
      })
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    const res = await request(app)
      .post('/api/products/order')
      .send({ productId: 1, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.order.total).toBe(20.00);
    expect(mockClient.query).toHaveBeenCalledTimes(5);
  });

  it('should return 409 when stock is insufficient', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Widget', price: 10.00, stock: 1 }],
      })
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    const res = await request(app)
      .post('/api/products/order')
      .send({ productId: 1, quantity: 5 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Insufficient stock');
  });

  it('returns 404 when the product is not found', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // SELECT FOR UPDATE
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    const res = await request(app)
      .post('/api/products/order')
      .send({ productId: 999, quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });

  it('returns 500 when the transaction fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockRejectedValueOnce(new Error('select failed'))
      .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

    const res = await request(app)
      .post('/api/products/order')
      .send({ productId: 1, quantity: 1 });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Order failed');
  });
});
