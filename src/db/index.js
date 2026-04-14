import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { getDatabaseConfig } from '../config/env.js';

const config = getDatabaseConfig();
console.log('🔗 Creando Pool con config:', JSON.stringify(config, (k,v) => k==='password' ? '***' : v));
const pool = new Pool(config);

// Manejo errores pool
pool.on('error', (err) => {
  console.error('❌ Error Pool PG (idle client):', err.message);
  console.error('Code:', err.code, 'Detail:', err.detail);
});

pool.on('connect', () => console.log('🔗 Nueva conexión PG establecida'));

const defaultUsers = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'seller', password: 'seller123', role: 'seller' },
  { username: 'client', password: 'client123', role: 'client' }
];

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
  console.log('🚀 Iniciando inicialización DB...');
  
  try {
    // Test conexión
    console.log('🔗 Testeando conexión DB...');
    const testResult = await query('SELECT 1 as test');
    console.log('✅ Conexión DB OK, test result:', testResult.rows[0]);
  } catch (connError) {
    console.error('💥 FALLO CONEXIÓN DB:', connError.message);
    console.error('Code:', connError.code, 'Stack:', connError.stack);
    throw new Error(`Conexión DB falló: ${connError.message}`);
  }

  try {
    await createTables();
    console.log('✅ Tablas creadas/verificadas');
  } catch (tableError) {
    console.error('💥 FALLO creando tablas:', tableError.message);
    throw tableError;
  }

  try {
    await seedUsers();
    console.log('✅ Users verificados/seeded');
  } catch (userError) {
    console.error('💥 FALLO seeding users:', userError.message);
    throw userError;
  }

  try {
    await seedInventoryDefaults();
    console.log('✅ Inventario inicial OK');
  } catch (invError) {
    console.error('💥 FALLO inventario inicial:', invError.message);
    throw invError;
  }

  console.log('✅ DB inicializada completamente');
}

export async function closeDatabase() {
  await pool.end();
}
