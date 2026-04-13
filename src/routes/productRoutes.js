import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  addCategory,
  addSupply,
  addWarehouse,
  adjustSupplyStock,
  editSupply,
  getSupplyById,
  removeCategory,
  removeSupply,
  removeWarehouse
} from '../services/inventoryService.js';
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

function parseRecipe(recipe) {
  if (!recipe) {
    return [];
  }

  if (Array.isArray(recipe)) {
    return recipe;
  }

  if (typeof recipe === 'string') {
    try {
      return JSON.parse(recipe);
    } catch (error) {
      return [];
    }
  }

  return [];
}

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
    const recipe = parseRecipe(req.body.recipe);
    const acceptsHtml = req.accepts('html');
    const isFormSubmission = req.is('application/x-www-form-urlencoded') || acceptsHtml;

    if (!name || !price || (stock === undefined && recipe.length === 0)) {
      if (isFormSubmission) {
        return res.status(400).send('Name, price, and stock/manual recipe are required');
      }
      return res.status(400).json({ error: 'Name, price, and stock/manual recipe are required' });
    }

    const product = await addProduct({ ...req.body, recipe });

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
    const product = await editProduct(parseInt(req.params.id, 10), {
      ...req.body,
      recipe: req.body.recipe !== undefined ? parseRecipe(req.body.recipe) : undefined
    });
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

router.post('/categories', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    return res.status(201).json(await addCategory(req.body));
  } catch (error) {
    return next(error);
  }
});

router.delete('/categories/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await removeCategory(parseInt(req.params.id, 10));
    if (!removed) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post('/warehouses', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Warehouse name is required' });
    }

    return res.status(201).json(await addWarehouse(req.body));
  } catch (error) {
    return next(error);
  }
});

router.delete('/warehouses/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await removeWarehouse(parseInt(req.params.id, 10));
    if (!removed) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post('/supplies', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Supply name is required' });
    }

    return res.status(201).json(await addSupply(req.body));
  } catch (error) {
    return next(error);
  }
});

router.get('/supplies/:id', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const supply = await getSupplyById(parseInt(req.params.id, 10));
    if (!supply) {
      return res.status(404).json({ error: 'Supply not found' });
    }

    return res.json(supply);
  } catch (error) {
    return next(error);
  }
});

router.put('/supplies/:id', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const supply = await editSupply(parseInt(req.params.id, 10), req.body);
    if (!supply) {
      return res.status(404).json({ error: 'Supply not found' });
    }

    return res.json(supply);
  } catch (error) {
    return next(error);
  }
});

router.delete('/supplies/:id', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const removed = await removeSupply(parseInt(req.params.id, 10));
    if (!removed) {
      return res.status(404).json({ error: 'Supply not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post('/supplies/:id/stock', requireAuth, requireRole(['admin', 'seller']), async (req, res, next) => {
  try {
    const quantity = parseFloat(req.body.quantity);
    const warehouseId = parseInt(req.body.warehouseId, 10);

    if (!Number.isFinite(quantity) || !Number.isInteger(warehouseId)) {
      return res.status(400).json({ error: 'Warehouse and quantity are required' });
    }

    const updated = await adjustSupplyStock(parseInt(req.params.id, 10), warehouseId, quantity);
    if (updated === false) {
      return res.status(400).json({ error: 'Insufficient supply stock' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
