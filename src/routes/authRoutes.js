import { Router } from 'express';
import { authenticateUser } from '../services/authService.js';

const router = Router();

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }

  return res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = authenticateUser(username, password);

  if (!user) {
    return res.render('login', { error: 'Credenciales inválidas' });
  }

  req.session.user = user;
  return res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

export default router;

