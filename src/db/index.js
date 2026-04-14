import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { getDatabaseConfig } from '../config/env.js';
import logger from '../utils/logger.js';
import { initSQLite, sqliteQuery, sqliteTransaction, closeSQLite, dbReady as sqliteReady } from './sqlite.js';

// Try PG first
let pool;
let isPostgres = false;
let dbReady = false;

try {
  pool = new Pool(getDatabaseConfig());
  // Quick connect test
  await pool.query('SELECT 1');
  isPostgres = true;
  logger.info('Postgres connection established');
} catch (error) {
  logger.warn('Postgres unavailable, falling back to SQLite', { error: error.message });
}

pool.on('error', (err) => {
  logger.error('Pool lost DB connection', { message: err.message, stack: err.stack });
});

export async function query(text, params = []) {
  if (isPostgres) {
    try {
      const result = await pool.query(text, params);
      logger.debug(`PG query OK: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
      return result;
    } catch (error) {
      logger.error('PG query failed', {
        sql: text.substring(0, 50),
        error: error.message,
        params: params ? params.map(p => typeof p === 'string' ? '***' : p) : undefined
      });
      throw error;
    }
  } else {
    return sqliteQuery(text, params);
  }
}

export async function withTransaction(callback) {
  if (isPostgres) {
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
  } else {
    // SQLite runner = dbInstance, sqliteQuery(sql, params)
    return sqliteTransaction(callback);
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
  logger.info('Starting DB initialization');
  try {
    if (!isPostgres) {
      await initSQLite();
      dbReady = sqliteReady;
      return;
    }
    // PG test already done at module load
    logger.info('Postgres connection test passed (module load)');
    
    await createTables();
    logger.info('Tables created/verified');
    
    await seedInventoryDefaults();
    logger.info('Seed data completed');
    dbReady = true;
  } catch (error) {
    logger.error('DB initialization failed', { error: error.message, stack: error.stack });
    dbReady = false;
    // Don't throw - graceful
  }
}

export { dbReady, isPostgres };


export async function closeDatabase() {
  if (isPostgres && pool) {
    await pool.end();
  } else {
    closeSQLite();
  }
}
