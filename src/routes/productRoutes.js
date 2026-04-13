import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  addProduct,
  addProductStock,
  editProduct,
  getProductById,
  listProducts,
  removeProduct,
  removeProductStock
} from '../services/productService.js';

const router = Router();

router.get('/products', async (req, res, next) => {
  try {
    res.json(await listProducts());
  } catch (error) {
    next(error);
  }
});

router.post('/products', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const { name, price, stock } = req.body;
    const acceptsHtml = req.accepts('html');
    const isFormSubmission = req.is('application/x-www-form-urlencoded') || acceptsHtml;

    if (!name || !price || stock === undefined) {
      if (isFormSubmission) {
        return res.status(400).send('Name, price, and stock are required');
      }
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    const product = await addProduct(req.body);

    if (isFormSubmission) {
      return res.redirect(req.session.user.role === 'admin' ? '/admin/products' : '/catalog');
    }

    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await getProductById(parseInt(req.params.id, 10));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.put('/products/:id', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const product = await editProduct(parseInt(req.params.id, 10), req.body);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.delete('/products/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await removeProduct(parseInt(req.params.id, 10));
    if (!removed) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post('/products/:id/add-stock', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const product = await addProductStock(parseInt(req.params.id, 10), quantity);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

router.post('/products/:id/remove-stock', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity is required' });
    }

    const product = await removeProductStock(parseInt(req.params.id, 10), quantity);
    if (product === null) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product === false) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    return res.json(product);
  } catch (error) {
    return next(error);
  }
});

export default router;

