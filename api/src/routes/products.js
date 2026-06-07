'use strict';
const { Router } = require('express');
const { pool }   = require('../db');

const router = Router();

// GET /api/products — list all products
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, price, stock, created_at FROM products ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id — single product
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, price, stock, created_at FROM products WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/products/order — place an order (transactional stock decrement)
router.post('/order', async (req, res, next) => {
  const { product_id, quantity } = req.body;

  // Input validation
  if (!product_id || !quantity) {
    return res.status(400).json({ error: 'product_id and quantity are required' });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'quantity must be a positive integer' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Decrement stock atomically — fails if stock < quantity
    const { rows: updated } = await client.query(
      `UPDATE products
         SET stock = stock - $1
       WHERE id = $2
         AND stock >= $1
       RETURNING id, name, stock`,
      [quantity, product_id]
    );

    if (!updated.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Insert the order record
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (product_id, quantity, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [product_id, quantity]
    );

    await client.query('COMMIT');

    res.status(201).json({
      order:   orderRows[0],
      product: updated[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
