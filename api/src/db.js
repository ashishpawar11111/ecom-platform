const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecom',
  user: process.env.DB_USER || 'ecom_user',
  password: process.env.DB_PASSWORD || 'changeme',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
  process.exit(-1);
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        price      DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        stock      INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id         SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        quantity   INTEGER NOT NULL CHECK (quantity > 0),
        total      DECIMAL(10, 2) NOT NULL,
        status     VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed products if table is empty
    const { rows } = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO products (name, price, stock) VALUES
          ('Wireless Headphones', 79.99, 150),
          ('USB-C Hub', 49.99, 200),
          ('Mechanical Keyboard', 129.99, 75),
          ('4K Monitor', 349.99, 30),
          ('Laptop Stand', 39.99, 300)
      `);
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
