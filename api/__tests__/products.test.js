const request = require('supertest');
const app     = require('../src/index');
const { mockQuery, mockClient, mockRelease } = require('../__mocks__/db');

afterEach(() => jest.clearAllMocks());

describe('GET /api/products', () => {
  it('returns product list', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, name: 'Widget A', price: '9.99', stock: 100 }]
    });
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /api/products/order', () => {
  it('returns 201 when stock is sufficient', async () => {
    // BEGIN + UPDATE (returns row) + INSERT + COMMIT
    mockQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ id: 1, stock: 99 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, product_id: 1, quantity: 1, status: 'pending' }] })
      .mockResolvedValueOnce({});
    const res = await request(app)
      .post('/api/products/order')
      .send({ product_id: 1, quantity: 1 });
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 when stock is insufficient', async () => {
    mockQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] }) // UPDATE returns no rows = insufficient stock
      .mockResolvedValueOnce({});          // ROLLBACK
    const res = await request(app)
      .post('/api/products/order')
      .send({ product_id: 1, quantity: 9999 });

    expect(res.statusCode).toBe(400);

    expect(res.body.error).toBe('Insufficient stock');
  });
});