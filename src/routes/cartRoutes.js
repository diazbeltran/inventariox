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

router.get('/cart', requireAuth, (req, res) => {
  const cart = getSessionCart(req.session);
  const total = getCartTotal(cart);
  res.render('cart', { cart, total, user: req.session.user });
});

router.post('/cart/add/:id', requireAuth, (req, res) => {
  const result = addItemToCart(req.session, parseInt(req.params.id, 10));
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({ message: 'Producto agregado' });
});

router.post('/cart/update/:id', requireAuth, (req, res) => {
  const result = updateCartItem(req.session, parseInt(req.params.id, 10), parseInt(req.body.quantity, 10));
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({ message: 'Cantidad actualizada' });
});

router.post('/cart/remove/:id', requireAuth, (req, res) => {
  removeCartItem(req.session, parseInt(req.params.id, 10));
  return res.status(200).json({ message: 'Producto removido' });
});

router.post('/cart/checkout', requireAuth, (req, res) => {
  const result = checkoutCart(req.session);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({ message: 'Compra generada' });
});

export default router;

