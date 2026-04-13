function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
    };
  }

  const port = parseInt(process.env.PGPORT || '5432', 10);
  const ssl = process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false };

  const host = process.env.PGHOST || 'localhost';
  const database = process.env.PGDATABASE || 'postgres';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || '';

  if (!host || !database || !user) {
    throw new Error('PGHOST, PGDATABASE, PGUSER required for non-DATABASE_URL mode');
  }

  return {
    host,
    port,
    database,
    user,
    password,
    ssl
  };
}

