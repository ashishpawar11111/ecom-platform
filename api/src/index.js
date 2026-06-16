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

/* istanbul ignore next */
async function stop() {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    server = undefined;
  }
  await pool.end();
}

/* istanbul ignore next */
async function start() {
  await initDB();
  server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API server running on port ${PORT}`);
  });
}

/* istanbul ignore next */
if (require.main === module) {
  process.once('SIGTERM', () => {
    // eslint-disable-next-line no-console
    console.log('SIGTERM received, shutting down gracefully...');
    stop().catch(err => {
      // eslint-disable-next-line no-console
      console.error('Failed to stop server:', err);
      throw err;
    });
  });

  start().catch(err => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    throw err;
  });
}

module.exports = app;
module.exports.start = start;
module.exports.stop = stop;
