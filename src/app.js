import express from 'express';
import { validationResult } from 'express-validator';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import productRoutes from './routes/productRoutes.js';
import { dbReady } from './db/index.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use(limiter);
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'", "'unsafe-inline'"]
  }
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

app.set('view engine', 'ejs');
app.set('views', './views');

app.use((req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    logger.warn('Validation errors', { errors: err.array(), url: req.url });
    return res.status(400).json({ errors: err.array() });
  }
  next();
});

app.use(authRoutes);
app.use(productRoutes);
app.use(cartRoutes);
app.use(clientRoutes);
app.use(offerRoutes);
app.use(pageRoutes);

// DB Status middleware/route
app.get('/db-status', (req, res) => {
  res.json({ dbReady: dbReady, isPostgres });
});

// Warn on DB ops if not ready
app.use((req, res, next) => {
  if (!dbReady && req.path.startsWith('/api/')) {
    logger.warn('API access denied: DB not ready', { path: req.path });
    return res.status(503).json({ error: 'Database not ready. Use /db-status to check.' });
  }
  next();
});

app.use((error, req, res, next) => {
  logger.error('App error', { error: error.message, stack: error.stack, url: req.url, method: req.method });
  if (res.headersSent) {
    return next(error);
  }
  return res.status(500).send('Internal Server Error');
});

export default app;
