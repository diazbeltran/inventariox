import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { getDatabaseConfig } from '../config/env.js';

const pool = new Pool(getDatabaseConfig());

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'seller', 'client'))
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT ''
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT ''
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS supplies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'unidad',
      cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS supply_stocks (
      id SERIAL PRIMARY KEY,
      supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
      warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
      quantity NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      UNIQUE (supply_id, warehouse_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS product_supplies (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE RESTRICT,
      quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
      PRIMARY KEY (product_id, supply_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS offers (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      discount INTEGER NOT NULL CHECK (discount > 0 AND discount <= 100),
      description TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL
    );
  `);
}

async function seedInventoryDefaults() {
  await query(
    `
      INSERT INTO warehouses (name, description)
      VALUES ($1, $2)
      ON CONFLICT (name) DO NOTHING
    `,
    ['Bodega Principal', 'Bodega inicial del sistema']
  );
}

export async function initializeDatabase() {
  await createTables();
  await seedInventoryDefaults();
}

export async function closeDatabase() {
  await pool.end();
}
