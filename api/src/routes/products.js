const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/products — list all products
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, price, stock FROM products ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/products/order — place an order (transactional)
router.post('/order', async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'Invalid productId or quantity' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the product row to prevent overselling
    const { rows: products } = await client.query(
      'SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE',
      [productId]
    );

    if (products.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    if (product.stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Insufficient stock',
        available: product.stock,
      });
    }

    const total = product.price * quantity;

    // Decrement stock
    await client.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2',
      [quantity, productId]
    );

    // Create order
    const { rows: orders } = await client.query(
      'INSERT INTO orders (product_id, quantity, total, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [productId, quantity, total, 'confirmed']
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully',
      order: orders[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order transaction failed:', err);
    res.status(500).json({ error: 'Order failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
