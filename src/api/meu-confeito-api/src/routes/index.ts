import { Router } from 'express';

import { authRoutes } from './auth.route';
import { ingredientRoutes } from './ingredient.route';
import { recipeRoutes } from './recipe.route';
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
routes.use('/users', userRoutes);

routes.use('/auth', authRoutes);

routes.use('/tags', tagRoutes);

routes.use('/ingredients', ingredientRoutes);

routes.use('/recipes', recipeRoutes);

export { routes };
