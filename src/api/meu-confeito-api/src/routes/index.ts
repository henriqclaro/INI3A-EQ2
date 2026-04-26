import { Router } from 'express';

import { userRoutes } from './user.route';

const routes = Router();

// TESTE DE API, DELETAR DEPOIS
routes.get('/ping', (req, res) => {
  return res.json({
    message: 'pong',
  });
});

// Adicionar as rotas aqui:
routes.use('/api/users', userRoutes);

export { routes };
