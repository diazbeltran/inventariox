import { query } from '../db/index.js';

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    stock: row.stock
  };
}

export async function getAllProducts() {
  const result = await query('SELECT id, name, description, price, stock FROM products ORDER BY id ASC');
  return result.rows.map(mapProduct);
}

export async function createProduct(data) {
  const result = await query(
    `
      INSERT INTO products (name, description, price, stock)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, description, price, stock
    `,
    [data.name, data.description || '', parseFloat(data.price), parseInt(data.stock, 10)]
  );

  return mapProduct(result.rows[0]);
}

export async function findProductById(id) {
  const result = await query('SELECT id, name, description, price, stock FROM products WHERE id = $1', [id]);
  return result.rows[0] ? mapProduct(result.rows[0]) : null;
}

export async function updateProduct(id, changes) {
  const current = await findProductById(id);
  if (!current) {
    return null;
  }

  const next = {
    name: changes.name !== undefined ? changes.name : current.name,
    description: changes.description !== undefined ? changes.description : current.description,
    price: changes.price !== undefined ? parseFloat(changes.price) : current.price,
    stock: changes.stock !== undefined ? parseInt(changes.stock, 10) : current.stock
  };

  const result = await query(
    `
      UPDATE products
      SET name = $2, description = $3, price = $4, stock = $5
      WHERE id = $1
      RETURNING id, name, description, price, stock
    `,
    [id, next.name, next.description, next.price, next.stock]
  );

  return mapProduct(result.rows[0]);
}

export async function deleteProduct(id) {
  const result = await query('DELETE FROM products WHERE id = $1', [id]);
  return result.rowCount > 0;
}

export async function changeProductStock(id, delta) {
  const result = await query(
    `
      UPDATE products
      SET stock = stock + $2
      WHERE id = $1 AND stock + $2 >= 0
      RETURNING id, name, description, price, stock
    `,
    [id, delta]
  );

  if (result.rowCount === 0) {
    const existing = await findProductById(id);
    return existing ? false : null;
  }

  return mapProduct(result.rows[0]);
}

