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

router.get('/products', (req, res) => {
  res.json(listProducts());
});

router.post('/products', requireAuth, requireRole(['admin', 'seller']), (req, res) => {
  const { name, price, stock } = req.body;
  const acceptsHtml = req.accepts('html');
  const isFormSubmission = req.is('application/x-www-form-urlencoded') || acceptsHtml;

  if (!name || !price || stock === undefined) {
    if (isFormSubmission) {
      return res.status(400).send('Name, price, and stock are required');
    }
    return res.status(400).json({ error: 'Name, price, and stock are required' });
  }

  const product = addProduct(req.body);

  if (isFormSubmission) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin/products' : '/catalog');
  }

  return res.status(201).json(product);
});

router.get('/products/:id', (req, res) => {
  const product = getProductById(parseInt(req.params.id, 10));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json(product);
});

router.put('/products/:id', requireAuth, requireRole(['admin', 'seller']), (req, res) => {
  const product = editProduct(parseInt(req.params.id, 10), req.body);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json(product);
});

router.delete('/products/:id', requireAuth, requireRole('admin'), (req, res) => {
  const removed = removeProduct(parseInt(req.params.id, 10));
  if (!removed) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(204).send();
});

router.post('/products/:id/add-stock', requireAuth, requireRole(['admin', 'seller']), (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity <= 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }

  const product = addProductStock(parseInt(req.params.id, 10), quantity);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json(product);
});

router.post('/products/:id/remove-stock', requireAuth, requireRole(['admin', 'seller']), (req, res) => {
  const { quantity } = req.body;
  if (quantity === undefined || quantity <= 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }

  const product = removeProductStock(parseInt(req.params.id, 10), quantity);
  if (product === null) {
    return res.status(404).json({ error: 'Product not found' });
  }
  if (product === false) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  return res.json(product);
});

export default router;

