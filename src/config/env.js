function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDatabaseConfig() {
  console.log('🔍 Configurando DB... Detectando entorno:', process.env.NODE_ENV || 'local');
  
  if (process.env.DATABASE_URL) {
    console.log('✅ Usando DATABASE_URL (Render/Producción)');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
    };
  }

  console.log('⚠️  Usando vars individuales PG (local dev)');
  return {
    host: requireEnv('PGHOST'),
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: requireEnv('PGDATABASE'),
    user: requireEnv('PGUSER'),
    password: requireEnv('PGPASSWORD'),
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
  };
}

console.log('✅ Config DB lista (keys: DATABASE_URL=', !!process.env.DATABASE_URL, ', PGHOST=', !!process.env.PGHOST, ')');
}

