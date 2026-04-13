import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { getDatabaseConfig } from '../config/env.js';

const pool = new Pool(getDatabaseConfig());

const defaultUsers = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'seller', password: 'seller123', role: 'seller' },
  { username: 'client', password: 'client123', role: 'client' }
];

export async function query(text, params = []) {
  return pool.query(text, params);
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

async function seedUsers() {
  for (const user of defaultUsers) {
    const password = bcrypt.hashSync(user.password, 10);
    await query(
      `
        INSERT INTO users (username, password, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (username) DO NOTHING
      `,
      [user.username, password, user.role]
    );
  }
}

export async function initializeDatabase() {
  await createTables();
  await seedUsers();
}

export async function closeDatabase() {
  await pool.end();
}

