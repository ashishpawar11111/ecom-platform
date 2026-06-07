'use strict';
const { Router } = require('express');
const { pool }   = require('../db');

const router = Router();

// GET /api/orders — list all orders, optional ?status= filter
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let query  = `SELECT o.id, o.product_id, p.name AS product_name,
                         o.quantity, o.status, o.created_at
                    FROM orders o
                    JOIN products p ON p.id = o.product_id`;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE o.status = $${params.length}`;
    }
    query += ' ORDER BY o.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id — single order
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.product_id, p.name AS product_name,
              o.quantity, o.status, o.created_at
         FROM orders o
         JOIN products p ON p.id = o.product_id
        WHERE o.id = $1`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status — update order status (pending → shipped → delivered)
router.patch('/:id/status', async (req, res, next) => {
  const { status } = req.body;
  const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
