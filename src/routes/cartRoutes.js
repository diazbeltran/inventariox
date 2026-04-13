import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  addItemToCart,
  checkoutCart,
  getCartTotal,
  getSessionCart,
  removeCartItem,
  updateCartItem
} from '../services/cartService.js';

const router = Router();

router.get('/cart', requireAuth, async (req, res, next) => {
  try {
    const cart = await getSessionCart(req.session);
    const total = getCartTotal(cart);
    res.render('cart', { cart, total, user: req.session.user });
  } catch (error) {
    next(error);
  }
});

router.post('/cart/add/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await addItemToCart(req.session, parseInt(req.params.id, 10));
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ message: 'Producto agregado' });
  } catch (error) {
    return next(error);
  }
});

router.post('/cart/update/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await updateCartItem(req.session, parseInt(req.params.id, 10), parseInt(req.body.quantity, 10));
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ message: 'Cantidad actualizada' });
  } catch (error) {
    return next(error);
  }
});

router.post('/cart/remove/:id', requireAuth, (req, res) => {
  removeCartItem(req.session, parseInt(req.params.id, 10));
  return res.status(200).json({ message: 'Producto removido' });
});

router.post('/cart/checkout', requireAuth, async (req, res, next) => {
  try {
    const result = await checkoutCart(req.session);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(200).json({ message: 'Compra generada' });
  } catch (error) {
    return next(error);
  }
});

export default router;

