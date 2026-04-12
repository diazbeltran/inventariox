import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listClients } from '../services/clientService.js';
import { listOffers, getCatalogProductsWithOffers } from '../services/offerService.js';
import { getInventorySummary, getProductById, listProducts } from '../services/productService.js';

const router = Router();

router.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/catalog');
});

router.get('/catalog', requireAuth, (req, res) => {
  const products = getCatalogProductsWithOffers(listProducts());
  res.render('catalog', { products, user: req.session.user });
});

router.get('/admin/dashboard', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.redirect('/');
  }

  const { products, totalValue, totalStock } = getInventorySummary();
  return res.render('admin/dashboard', {
    user: req.session.user,
    products,
    clients: listClients(),
    offers: listOffers(),
    totalValue,
    totalStock
  });
});

router.get('/admin/products', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.redirect('/');
  }

  return res.render('admin/products', { products: listProducts(), user: req.session.user });
});

router.get('/admin/clients', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.redirect('/');
  }

  return res.render('admin/clients', { clients: listClients(), user: req.session.user });
});

router.get('/admin/offers', requireAuth, (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.redirect('/');
  }

  return res.render('admin/offers', { offers: listOffers(), products: listProducts(), user: req.session.user });
});

router.get('/add', requireAuth, (req, res) => {
  res.render('add', { user: req.session.user });
});

router.get('/edit/:id', requireAuth, (req, res) => {
  const product = getProductById(parseInt(req.params.id, 10));
  if (!product) {
    return res.status(404).send('Product not found');
  }

  return res.render('edit', { product, user: req.session.user });
});

export default router;

