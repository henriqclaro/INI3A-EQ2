import { Router } from 'express';

import { authRoutes } from './auth.route';
import { tagRoutes } from './tag.route';
import { userRoutes } from './user.route';

const routes = Router();

// TESTE DE API, DELETAR DEPOIS
routes.get('/ping', (_req, res) => {
  return res.json({
    message: 'pong',
  });
});

// Adicionar as rotas abaixo desse comentário:
routes.use('api/v1/users', userRoutes);

routes.use('api/v1/auth', authRoutes);

routes.use('api/v1/tags', tagRoutes);

export { routes };
