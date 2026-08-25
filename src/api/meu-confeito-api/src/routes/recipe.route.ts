import { Router } from 'express';

import { RecipeController } from '../controllers/recipe.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as recipe from '../validation/recipe.schema';

const recipeRoutes = Router();
const recipeController = new RecipeController();

recipeRoutes.use(authMiddleware);

recipeRoutes.post(
  '/',
  validate({ body: recipe.registerSchema }),
  recipeController.register.bind(recipeController),
);

recipeRoutes.get(
  '/:id',
  validate({ params: recipe.paramsSchema }),
  recipeController.selectSingle.bind(recipeController),
);

recipeRoutes.get(
  '/:id/users/:userId',
  validate({ params: recipe.userInventoryParamsSchema }),
  recipeController.selectSingleUserInventory.bind(recipeController),
);

recipeRoutes.get(
  '/',
  validate({ query: recipe.querySchema }),
  recipeController.search.bind(recipeController),
);

export { recipeRoutes };
