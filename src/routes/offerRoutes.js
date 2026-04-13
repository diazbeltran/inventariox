import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  addOffer,
  editOffer,
  ensureOfferProductExists,
  getOfferById,
  removeOffer,
  validateOfferDates
} from '../services/offerService.js';

const router = Router();

router.get('/offers/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const offer = await getOfferById(parseInt(req.params.id, 10));
    if (!offer) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }

    return res.json(offer);
  } catch (error) {
    return next(error);
  }
});

router.post('/offers', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { productId, discount, startDate, endDate } = req.body;
    if (!productId || !discount || !startDate || !endDate) {
      return res.status(400).json({ error: 'Product ID, discount, startDate y endDate son requeridos' });
    }
    if (!(await ensureOfferProductExists(productId))) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (!validateOfferDates(startDate, endDate)) {
      return res.status(400).json({ error: 'Las fechas de inicio y fin deben ser válidas y startDate <= endDate' });
    }

    return res.status(201).json(await addOffer(req.body));
  } catch (error) {
    return next(error);
  }
});

router.put('/offers/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const existing = await getOfferById(parseInt(req.params.id, 10));
    if (!existing) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }

    const candidate = { ...existing, ...req.body };
    if (candidate.productId !== undefined && !(await ensureOfferProductExists(candidate.productId))) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (!validateOfferDates(candidate.startDate, candidate.endDate)) {
      return res.status(400).json({ error: 'Las fechas de oferta deben ser válidas y startDate <= endDate' });
    }

    return res.json(await editOffer(parseInt(req.params.id, 10), req.body));
  } catch (error) {
    return next(error);
  }
});

router.delete('/offers/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await removeOffer(parseInt(req.params.id, 10));
    if (!removed) {
      return res.status(404).json({ error: 'Oferta no encontrada' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;

