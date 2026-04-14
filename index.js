import dotenv from 'dotenv';
dotenv.config();

import logger from './src/utils/logger.js';
import app from './src/app.js';
import { initializeDatabase, dbReady } from './src/db/index.js';

const port = process.env.PORT || 3000;

(async () => {
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.warn('Database init failed - continuing with limited functionality', { error: error.message });
  }
  
  const server = app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
    const dbStatus = dbReady ? 'Ready' : 'Fallback/Limited (SQLite or errors)';
    logger.info(`DB Status: ${dbStatus}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🚀 Server running on http://localhost:${port} | DB: ${dbStatus}`);
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing DB');
    const { closeDatabase } = await import('./src/db/index.js');
    await closeDatabase();
    server.close(() => {
      process.exit(0);
    });
  });
})();
