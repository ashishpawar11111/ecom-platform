const request = require('supertest');
const app = require('../src/index');
const cartService = require('../src/services/cartService');

jest.mock('../src/services/cartService');

afterEach(() => jest.clearAllMocks());

const sampleCart = {
  id: 1,
  cartId: 'default',
  items: [
    {
      productId: 1,
      name: 'Wireless Headphones',
      price: '79.99',
      stock: 150,
      quantity: 2,
      total: '159.98',
    },
  ],
  total: 159.98,
};

describe('Cart routes', () => {
  it('GET /api/cart returns the current cart', async () => {
    cartService.getCart.mockResolvedValueOnce(sampleCart);

    const res = await request(app).get('/api/cart');

    expect(res.statusCode).toBe(200);
    expect(res.body.cartId).toBe('default');
    expect(res.body.items).toHaveLength(1);
    expect(cartService.getCart).toHaveBeenCalledWith(undefined);
  });

  it('POST /api/cart/items adds an item to the cart', async () => {
    cartService.addItem.mockResolvedValueOnce(sampleCart);

    const res = await request(app)
      .post('/api/cart/items')
      .send({ productId: 1, quantity: 2 });

    expect(res.statusCode).toBe(201);
    expect(res.body.total).toBe(159.98);
    expect(cartService.addItem).toHaveBeenCalledWith({
      cartId: undefined,
      productId: 1,
      quantity: 2,
    });
  });

  it('POST /api/cart/checkout converts cart items into orders', async () => {
    cartService.checkout.mockResolvedValueOnce({
      cartId: 'default',
      message: 'Checkout complete',
      orders: [{ id: 1, product_id: 1, quantity: 2, total: '159.98' }],
    });

    const res = await request(app).post('/api/cart/checkout');

    expect(res.statusCode).toBe(201);
    expect(res.body.orders).toHaveLength(1);
    expect(cartService.checkout).toHaveBeenCalledWith(undefined);
  });

  it('returns service errors with their status code', async () => {
    const err = new Error('Insufficient stock');
    err.statusCode = 409;
    err.details = { available: 1 };
    cartService.addItem.mockRejectedValueOnce(err);

    const res = await request(app)
      .post('/api/cart/items')
      .send({ productId: 1, quantity: 5 });

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: 'Insufficient stock', available: 1 });
  });
});
