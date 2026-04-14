import app from './src/app.js';
import { initializeDatabase } from './src/db/index.js';

const port = process.env.PORT || 3000;

try {
  console.log('🌐 Iniciando servidor en puerto:', port);
  await initializeDatabase();
  app.listen(port, '0.0.0.0', () => {
    console.log('🎉 Servidor listo en puerto ' + port + ' (Render OK) 🎉');
  });
} catch (error) {
  console.error('💥 Falla inicialización app:', error.message);
  console.error('Detalle:', error);
  process.exit(1);
}
