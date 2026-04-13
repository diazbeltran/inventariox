import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { addClient, editClient, getClientById, removeClient } from '../services/clientService.js';

const router = Router();

router.get('/clients/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const client = await getClientById(parseInt(req.params.id, 10));
    if (!client) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    return res.json(client);
  } catch (error) {
    return next(error);
  }
});

router.post('/clients', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    return res.status(201).json(await addClient(req.body));
  } catch (error) {
    return next(error);
  }
});

router.put('/clients/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const client = await editClient(parseInt(req.params.id, 10), req.body);
    if (!client) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    return res.json(client);
  } catch (error) {
    return next(error);
  }
});

router.delete('/clients/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const removed = await removeClient(parseInt(req.params.id, 10));
    if (!removed) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;

