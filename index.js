import app from './src/app.js';
import { initializeDatabase, closeDatabase } from './src/db/index.js';

const port = process.env.PORT || 3000;

try {
  console.log('🌐 Iniciando servidor en puerto:', port);
  await initializeDatabase();
  console.log('✅ DB lista - Iniciando Express...');
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🎉 Servidor listo en puerto ${port} (Render OK) 🎉`);
    console.log('🔗 Test /health en: http://localhost:' + port + '/health');
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM recibido - Cerrando graceful...');
    await closeDatabase();
    server.close(() => {
      console.log('✅ Servidor cerrado');
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('💥 FALLO INICIALIZACIÓN CRÍTICA:', error.message);
  console.error('Stack completo:', error.stack);
  console.error('🙋‍♂️ APP en modo degradado - Ver logs Render para detalles');
  // No exit(1) - permite health checks fallar en Render
  app.listen(port, '0.0.0.0', () => {
    console.log('⚠️ Servidor UP sin DB - Solo /health responde');
  });
}
