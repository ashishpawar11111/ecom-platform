const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/orders — list orders, optionally filter by status
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT o.id, o.quantity, o.total, o.status, o.created_at,
             p.name AS product_name, p.price AS unit_price
      FROM orders o
      JOIN products p ON p.id = o.product_id
    `;
    const params = [];

    if (status) {
      query += ' WHERE o.status = $1';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id — single order detail
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, p.name AS product_name
       FROM orders o
       JOIN products p ON p.id = o.product_id
       WHERE o.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/status', async (req, res) => {
  const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${allowedStatuses.join(', ')}`,
    });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders — create order
router.post('/', async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'productId and quantity are required' });
    }

    const productResult = await pool.query(
      'SELECT id, name, price FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];
    const total = Number(product.price) * Number(quantity);

    const orderResult = await pool.query(
      `INSERT INTO orders (product_id, quantity, total, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, product_id, quantity, total, status, created_at`,
      [productId, quantity, total, 'pending']
    );

    res.status(201).json(orderResult.rows[0]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
