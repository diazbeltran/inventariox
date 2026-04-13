import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listClients } from '../services/clientService.js';
import { getInventoryStructure } from '../services/inventoryService.js';
import { getCatalogProductsWithOffers, listOffers } from '../services/offerService.js';
import { getInventorySummary, getProductById, listProducts } from '../services/productService.js';

const router = Router();

router.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/catalog');
});

router.get('/catalog', requireAuth, async (req, res, next) => {
  try {
    const products = await getCatalogProductsWithOffers(await listProducts());
    res.render('catalog', { products, user: req.session.user });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/dashboard', requireAuth, async (req, res, next) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.redirect('/');
    }

    const { products, totalValue, totalStock, recipeProducts, manualProducts } = await getInventorySummary();
    const inventory = await getInventoryStructure();
    return res.render('admin/dashboard', {
      user: req.session.user,
      products,
      supplies: inventory.supplies,
      warehouses: inventory.warehouses,
      clients: await listClients(),
      offers: await listOffers(),
      totalValue,
      totalStock,
      recipeProducts,
      manualProducts
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/products', requireAuth, async (req, res, next) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.redirect('/');
    }

    const inventory = await getInventoryStructure();
    return res.render('admin/products', {
      products: await listProducts(),
      supplies: inventory.supplies,
      categories: inventory.categories,
      warehouses: inventory.warehouses,
      user: req.session.user
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/clients', requireAuth, async (req, res, next) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.redirect('/');
    }

    return res.render('admin/clients', { clients: await listClients(), user: req.session.user });
  } catch (error) {
    return next(error);
  }
});

router.get('/admin/offers', requireAuth, async (req, res, next) => {
  try {
    if (req.session.user.role !== 'admin') {
      return res.redirect('/');
    }

    return res.render('admin/offers', {
      offers: await listOffers(),
      products: await listProducts(),
      user: req.session.user
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/add', requireAuth, (req, res) => {
  res.render('add', { user: req.session.user });
});

router.get('/edit/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await getProductById(parseInt(req.params.id, 10));
    if (!product) {
      return res.status(404).send('Product not found');
    }

    return res.render('edit', { product, user: req.session.user });
  } catch (error) {
    return next(error);
  }
});

export default router;
