import { Router } from 'express';
import { authenticateUser } from '../services/authService.js';

const router = Router();

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }

  return res.render('login', { error: null });
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await authenticateUser(username, password);

    if (!user) {
      return res.render('login', { error: 'Credenciales inválidas' });
    }

    req.session.user = user;
    return res.redirect('/');
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

export default router;

