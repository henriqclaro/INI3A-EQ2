import { Router } from 'express';

import { analyticsRoutes } from './modules/analytics/analytics.route';
import { authRoutes } from './modules/auth/auth.route';
import { bakerProfileRoutes } from './modules/baker-profile/baker-profile.route';
import { ingredientRoutes } from './modules/ingredient/ingredient.route';
import { inventoryRoutes } from './modules/inventory/inventory.route';
import { productionRoutes } from './modules/production/production.route';
import { recipeRoutes } from './modules/recipe/recipe.route';
import { tagRoutes } from './modules/tag/tag.route';
import { userRoutes } from './modules/user/user.route';

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

routes.use('/inventory', inventoryRoutes);

routes.use('/recipes', recipeRoutes);

routes.use('/productions', productionRoutes);

routes.use('/baker-profiles', bakerProfileRoutes);

routes.use('/analytics', analyticsRoutes);

export { routes };
