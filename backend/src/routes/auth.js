import { Router } from 'express';
import { signToken } from '../middleware/auth.js';
import { createUser, validateCredentials } from '../services/users.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'As senhas não coincidem.' });
  }

  try {
    const user = await createUser(username, password);
    res.status(201).json({
      message: 'Conta criada com sucesso. Faça login para continuar.',
      username: user.username,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

authRouter.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  if (!['presenter', 'player'].includes(role)) {
    return res.status(400).json({ error: 'Escolha o perfil: apresentador ou jogador.' });
  }

  const user = await validateCredentials(username, password);

  if (!user) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  const token = signToken({ username: user.username, role });

  res.json({
    token,
    username: user.username,
    role,
    roleLabel: role === 'presenter' ? 'Apresentador' : 'Jogador',
  });
});
