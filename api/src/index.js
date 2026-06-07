'use strict';
require('dotenv').config();
const express   = require('express');
const pinoHttp  = require('pino-http');
const { pool }  = require('./db');
const products  = require('./routes/products');
const orders    = require('./routes/orders');

const app = express();

// Structured JSON logging — every request logged, Splunk-ready (Phase 5)
app.use(pinoHttp({
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined
}));

app.use(express.json());

// ── Health endpoints ──────────────────────────────────────────────────────────
// /health      — liveness probe  (is the process alive?)
// /health/db   — readiness probe (can we serve traffic? tests real DB conn)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/health/db', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (err) {
    // Return 503 so K8s readiness probe removes pod from endpoints
    res.status(503).json({ status: 'error', db: err.message });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/products', products);
app.use('/api/orders',   orders);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

// Only call listen when running directly — not when required by tests
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ecom-api listening on port ${PORT}`);
  });
}

module.exports = app;
