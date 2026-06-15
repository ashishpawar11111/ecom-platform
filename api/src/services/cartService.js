const { pool } = require('../db');

const DEFAULT_CART_KEY = 'default';

function normalizeCartKey(cartId) {
  return String(cartId || DEFAULT_CART_KEY).trim() || DEFAULT_CART_KEY;
}

async function getOrCreateCart(cartKey, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO carts (cart_key)
     VALUES ($1)
     ON CONFLICT (cart_key)
     DO UPDATE SET updated_at = NOW()
     RETURNING id, cart_key, created_at, updated_at`,
    [normalizeCartKey(cartKey)]
  );
  return rows[0];
}

async function getCart(cartKey, client = pool) {
  const cart = await getOrCreateCart(cartKey, client);
  const { rows } = await client.query(
    `SELECT ci.product_id AS "productId",
            p.name,
            p.price,
            p.stock,
            ci.quantity,
            (p.price * ci.quantity)::numeric(10, 2) AS total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC`,
    [cart.id]
  );

  const total = rows.reduce((sum, item) => sum + Number(item.total), 0);
  return {
    id: cart.id,
    cartId: cart.cart_key,
    items: rows,
    total: Number(total.toFixed(2)),
  };
}

async function addItem({ cartId, productId, quantity }) {
  const requestedQuantity = Number(quantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1 || !productId) {
    const error = new Error('productId and a positive integer quantity are required');
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cart = await getOrCreateCart(cartId, client);
    const { rows: products } = await client.query(
      'SELECT id, stock FROM products WHERE id = $1',
      [productId]
    );

    if (!products.length) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const { rows: existingItems } = await client.query(
      'SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cart.id, productId]
    );
    const nextQuantity = requestedQuantity + Number(existingItems[0]?.quantity || 0);

    if (nextQuantity > products[0].stock) {
      const error = new Error('Insufficient stock');
      error.statusCode = 409;
      error.details = { available: products[0].stock };
      throw error;
    }

    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                     updated_at = NOW()`,
      [cart.id, productId, requestedQuantity]
    );

    const updatedCart = await getCart(cart.cart_key, client);
    await client.query('COMMIT');
    return updatedCart;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateItem({ cartId, productId, quantity }) {
  const nextQuantity = Number(quantity);
  if (!Number.isInteger(nextQuantity) || nextQuantity < 1 || !productId) {
    const error = new Error('productId and a positive integer quantity are required');
    error.statusCode = 400;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cart = await getOrCreateCart(cartId, client);

    const { rows: products } = await client.query(
      'SELECT id, stock FROM products WHERE id = $1',
      [productId]
    );
    if (!products.length) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    if (nextQuantity > products[0].stock) {
      const error = new Error('Insufficient stock');
      error.statusCode = 409;
      error.details = { available: products[0].stock };
      throw error;
    }

    const { rowCount } = await client.query(
      `UPDATE cart_items
          SET quantity = $1, updated_at = NOW()
        WHERE cart_id = $2 AND product_id = $3`,
      [nextQuantity, cart.id, productId]
    );
    if (!rowCount) {
      const error = new Error('Cart item not found');
      error.statusCode = 404;
      throw error;
    }

    const updatedCart = await getCart(cart.cart_key, client);
    await client.query('COMMIT');
    return updatedCart;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function removeItem({ cartId, productId }) {
  const cart = await getOrCreateCart(cartId);
  await pool.query(
    'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cart.id, productId]
  );
  return getCart(cart.cart_key);
}

async function clearCart(cartId) {
  const cart = await getOrCreateCart(cartId);
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
  return getCart(cart.cart_key);
}

async function checkout(cartId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cart = await getOrCreateCart(cartId, client);
    const { rows: items } = await client.query(
      `SELECT ci.product_id,
              ci.quantity,
              p.name,
              p.price,
              p.stock
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = $1
        ORDER BY ci.created_at ASC
        FOR UPDATE OF p`,
      [cart.id]
    );

    if (!items.length) {
      const error = new Error('Cart is empty');
      error.statusCode = 400;
      throw error;
    }

    const insufficient = items.find((item) => item.quantity > item.stock);
    if (insufficient) {
      const error = new Error('Insufficient stock');
      error.statusCode = 409;
      error.details = {
        productId: insufficient.product_id,
        available: insufficient.stock,
      };
      throw error;
    }

    const orders = [];
    for (const item of items) {
      const total = Number(item.price) * Number(item.quantity);
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
      const { rows } = await client.query(
        `INSERT INTO orders (product_id, quantity, total, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, product_id, quantity, total, status, created_at`,
        [item.product_id, item.quantity, total, 'confirmed']
      );
      orders.push(rows[0]);
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
    await client.query('COMMIT');

    return {
      cartId: cart.cart_key,
      message: 'Checkout complete',
      orders,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  addItem,
  checkout,
  clearCart,
  getCart,
  normalizeCartKey,
  removeItem,
  updateItem,
};
