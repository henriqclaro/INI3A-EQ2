import { Router } from 'express';

import { authRoutes } from './auth.route';
import { userRoutes } from './user.route';

const routes = Router();

// TESTE DE API, DELETAR DEPOIS
routes.get('/ping', (_req, res) => {
  return res.json({
    message: 'pong',
  });
});

// Adicionar as rotas abaixo desse comentário:
routes.use('/api/users', userRoutes);

routes.use('/api/auth', authRoutes);

export { routes };
