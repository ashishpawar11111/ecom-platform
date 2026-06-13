const express = require('express');
const cartService = require('../services/cartService');

const router = express.Router();

function getCartId(req) {
  return req.query.cartId || req.body.cartId || req.get('x-cart-id');
}

function sendError(res, err) {
  const statusCode = err.statusCode || 500;
  const body = { error: statusCode === 500 ? 'Internal server error' : err.message };
  if (err.details) {
    Object.assign(body, err.details);
  }
  if (statusCode === 500) {
    console.error('Cart service error:', err);
  }
  res.status(statusCode).json(body);
}

// GET /api/cart - read the current cart
router.get('/', async (req, res) => {
  try {
    const cart = await cartService.getCart(getCartId(req));
    res.json(cart);
  } catch (err) {
    sendError(res, err);
  }
});

// POST /api/cart/items - add a product to the cart
router.post('/items', async (req, res) => {
  try {
    const cart = await cartService.addItem({
      cartId: getCartId(req),
      productId: req.body.productId,
      quantity: req.body.quantity,
    });
    res.status(201).json(cart);
  } catch (err) {
    sendError(res, err);
  }
});

// PATCH /api/cart/items/:productId - replace the quantity for one cart item
router.patch('/items/:productId', async (req, res) => {
  try {
    const cart = await cartService.updateItem({
      cartId: getCartId(req),
      productId: req.params.productId,
      quantity: req.body.quantity,
    });
    res.json(cart);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE /api/cart/items/:productId - remove one cart item
router.delete('/items/:productId', async (req, res) => {
  try {
    const cart = await cartService.removeItem({
      cartId: getCartId(req),
      productId: req.params.productId,
    });
    res.json(cart);
  } catch (err) {
    sendError(res, err);
  }
});

// DELETE /api/cart - clear the cart
router.delete('/', async (req, res) => {
  try {
    const cart = await cartService.clearCart(getCartId(req));
    res.json(cart);
  } catch (err) {
    sendError(res, err);
  }
});

// POST /api/cart/checkout - convert cart items into orders and decrement stock
router.post('/checkout', async (req, res) => {
  try {
    const result = await cartService.checkout(getCartId(req));
    res.status(201).json(result);
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
