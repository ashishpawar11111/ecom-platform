const express = require('express');
const cors = require('cors');
const { pool, initDB } = require('./db');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 3000;
let server;

app.use(cors());
app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db: result.rows[0].now });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

// Graceful shutdown
process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  if (server) {
    server.close();
  }
});

async function start() {
  await initDB();
  server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API server running on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch(err => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    throw err;
  });
}

module.exports = app;
