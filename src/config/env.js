function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDatabaseConfig() {
  console.log('🔍 Configurando DB... Entorno:', process.env.NODE_ENV || 'local');
  console.log('DB vars detectadas - DATABASE_URL:', !!process.env.DATABASE_URL, 'PGHOST:', !!process.env.PGHOST);
  
  if (process.env.DATABASE_URL) {
    const maskedUrl = process.env.DATABASE_URL.replace(/:(.*?)@/,' :***@');
    console.log('✅ DATABASE_URL detectada (Render):', maskedUrl);
    if (!process.env.DATABASE_URL.startsWith('postgres://') && !process.env.DATABASE_URL.startsWith('postgresql://')) {
      console.warn('⚠️ DATABASE_URL no parece Postgres URI válida');
    }
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
    };
  }

  console.log('⚠️ Usando vars PG individuales (local)');
  const config = {
    host: requireEnv('PGHOST'),
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: requireEnv('PGDATABASE'),
    user: requireEnv('PGUSER'),
    password: requireEnv('PGPASSWORD'),
    ssl: { rejectUnauthorized: false }
  };
  console.log('Config local - Host:', config.host, 'DB:', config.database);
  return config;
}

console.log('✅ Config DB lista!');

