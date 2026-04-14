import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../inventariox.db');

let db;
let dbReady = false;

export function getSQLiteConfig() {
  if (!db) {
    db = new Database(dbPath);
    logger.info('SQLite DB initialized', { path: dbPath });
  }
  return db;
}

async function createSQLiteTables() {
  const dbInstance = getSQLiteConfig();
  try {
    // Note: SQLite uses AUTOINCREMENT, NUMERIC, etc.
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'seller', 'client'))
      )
    `);

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price REAL NOT NULL CHECK (price >= 0),
        stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
      )
    `);

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT ''
      )
    `);

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT ''
      )
    `);

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS supplies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        unit TEXT NOT NULL DEFAULT 'unidad',
        cost REAL NOT NULL DEFAULT 0 CHECK (cost >= 0),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS supply_stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE CASCADE,
        warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        quantity REAL NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        UNIQUE (supply_id, warehouse_id)
      )
    `);

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS product_supplies (
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        supply_id INTEGER NOT NULL REFERENCES supplies(id) ON DELETE RESTRICT,
        quantity REAL NOT NULL CHECK (quantity > 0),
        PRIMARY KEY (product_id, supply_id)
      )
    `);

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL
      )
    `);

    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        discount INTEGER NOT NULL CHECK (discount > 0 AND discount <= 100),
        description TEXT NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT 1,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL
      )
    `);

    logger.info('SQLite tables created/verified');
  } catch (error) {
    logger.error('SQLite tables creation failed', { error: error.message });
    throw error;
  }
}

async function seedSQLiteDefaults() {
  const dbInstance = getSQLiteConfig();
  try {
    dbInstance.prepare(`
      INSERT OR IGNORE INTO warehouses (name, description)
      VALUES (?, ?)
    `).run('Bodega Principal', 'Bodega inicial del sistema');

    // Seed admin user
    const bcrypt = await import('bcrypt');
    const hashedPassword = bcrypt.hashSync('123123', 10);
    dbInstance.prepare(`
      INSERT OR IGNORE INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run('admin', hashedPassword, 'admin');

    logger.info('SQLite seed data completed (incl. admin user)');
  } catch (error) {
    logger.error('SQLite seed failed', { error: error.message });
    throw error;
  }
}

export async function initSQLite() {
  logger.info('Starting SQLite initialization');
  try {
    await createSQLiteTables();
    await seedSQLiteDefaults();
    dbReady = true;
    logger.info('SQLite ready');
  } catch (error) {
    logger.error('SQLite initialization failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

export function sqliteQuery(sql, params = []) {
  const dbInstance = getSQLiteConfig();
  try {
    // Convert PG $1,$2 to SQLite ? placeholders
    let sqliteSql = sql.replace(/\$(\d+)/g, '?');
    const stmt = dbInstance.prepare(sqliteSql);
    const result = stmt.all(...params);
    logger.debug(`SQLite query OK: ${sqliteSql.substring(0, 50)}${sqliteSql.length > 50 ? '...' : ''}`);
    return { rows: result };
  } catch (error) {
    logger.error('SQLite query failed', {
      sql: sql.substring(0, 50),
      error: error.message,
      params
    });
    throw error;
  }
}

export function sqliteTransaction(callback) {
  const dbInstance = getSQLiteConfig();
  try {
    dbInstance.exec('BEGIN');
    const result = callback({ query: (sql, params) => sqliteQuery(sql, params).rows });
    dbInstance.exec('COMMIT');
    return result;
  } catch (error) {
    dbInstance.exec('ROLLBACK');
    throw error;
  }
}

export async function closeSQLite() {
  if (db) {
    db.close();
    logger.info('SQLite closed');
  }
}

export { dbReady };

