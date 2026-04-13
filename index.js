import app from './src/app.js';
import { initializeDatabase } from './src/db/index.js';

const port = process.env.PORT || 3000;

try {
  await initializeDatabase();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error('Failed to initialize application:', error);
  process.exit(1);
}
