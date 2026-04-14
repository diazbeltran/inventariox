import express from 'express';
import session from 'express-session';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import productRoutes from './routes/productRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'inventariox-dev-secret-fallback',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24h
    }
  })
);

// Health check endpoint para Render
app.get('/health', async (req, res) => {
  try {
    const { query: dbQuery } = await import('./db/index.js');
    await dbQuery('SELECT 1');
    res.status(200).json({ status: 'OK', db: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check DB fail:', error.message);
    res.status(500).json({ status: 'ERROR', db: 'disconnected', error: error.message });
  }
});

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(authRoutes);
app.use(productRoutes);
app.use(cartRoutes);
app.use(clientRoutes);
app.use(offerRoutes);
app.use(pageRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).send('Internal Server Error');
});

export default app;
