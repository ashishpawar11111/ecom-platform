'use strict';
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'ecomdb',
  user:     process.env.DB_USER     || 'ecom',
  password: process.env.DB_PASSWORD || 'changeme',
  max:                20,
  idleTimeoutMillis:  30000,
  connectionTimeoutMillis: 2000,
});

// Log pool errors — never let them crash the process silently
pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err.message);
});

/**
 * Creates the schema on first startup if tables don't exist yet.
 * Safe to call multiple times — all statements are idempotent.
 */
async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id         SERIAL PRIMARY KEY,
        name       TEXT           NOT NULL,
        price      NUMERIC(10,2)  NOT NULL CHECK (price >= 0),
        stock      INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
        created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id         SERIAL PRIMARY KEY,
        product_id INTEGER        NOT NULL REFERENCES products(id),
        quantity   INTEGER        NOT NULL CHECK (quantity > 0),
        status     TEXT           NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
      );

      -- Seed one product so the app works on first run
      INSERT INTO products (name, price, stock)
      SELECT 'Widget A', 9.99, 100
      WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

      INSERT INTO products (name, price, stock)
      SELECT 'Widget B', 19.99, 50
      WHERE (SELECT COUNT(*) FROM products) < 2;
    `);
    console.log('DB schema initialised');
  } finally {
    client.release();
  }
}

// Initialise schema when module is first loaded (skipped in tests via mock)
initSchema().catch((err) => {
  console.error('Schema init failed:', err.message);
});

module.exports = { pool };
