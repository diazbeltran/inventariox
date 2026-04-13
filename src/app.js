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
    secret: 'inventariox-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

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
