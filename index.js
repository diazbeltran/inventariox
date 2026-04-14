import app from './src/app.js';
import { initializeDatabase } from './src/db/index.js';

const port = process.env.PORT || 3000;

try {
  console.log('🌐 Iniciando servidor en puerto:', port);
  await initializeDatabase();
  console.log('🎉 Servidor listo en http://localhost:' + port);
} catch (error) {
  console.error('💥 Falla inicialización app:', error.message);
  console.error('Detalle:', error);
  process.exit(1);
}
