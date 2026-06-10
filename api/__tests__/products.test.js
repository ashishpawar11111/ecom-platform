const request = require('supertest');

// Mock pg Pool before requiring app
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

describe('POST /api/products/order', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValue(mockClient);
  });

  afterEach(() => jest.clearAllMocks());

  it('should place an order and decrement stock', async () => {
    // BEGIN
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({   // SELECT FOR UPDATE
        rows: [{ id: 1, name: 'Widget', price: 10.00, stock: 50 }],
      })
      .mockResolvedValueOnce({}) // UPDATE stock
      .mockResolvedValueOnce({   // INSERT order
        rows: [{ id: 1, product_id: 1, quantity: 2, total: 20.00, status: 'confirmed' }],
      })
      .mockResolvedValueOnce({}); // COMMIT

    const res = await request(app)
      .post('/api/products/order')
      .send({ productId: 1, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.order.total).toBe(20.00);
    expect(mockClient.query).toHaveBeenCalledTimes(5);
  });

  it('should return 409 when stock is insufficient', async () => {
    mockClient.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Widget', price: 10.00, stock: 1 }],
      })
      .mockResolvedValueOnce({}); // ROLLBACK

    const res = await request(app)
      .post('/api/products/order')
      .send({ productId: 1, quantity: 5 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Insufficient stock');
  });
});
