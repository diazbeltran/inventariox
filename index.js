import dotenv from 'dotenv';
dotenv.config();

import logger from './src/utils/logger.js';
import app from './src/app.js';
import { initializeDatabase } from './src/db/index.js';

const port = process.env.PORT || 3000;

try {
  await initializeDatabase();
  logger.info('Database initialized successfully');
  
  const server = app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🚀 Server & DB ready on http://localhost:${port}`);
    }
  });
} catch (error) {
  logger.error('App startup failed', { error: error.message, stack: error.stack });
  console.error('Failed to start:', error.message);
  process.exit(1);
}
