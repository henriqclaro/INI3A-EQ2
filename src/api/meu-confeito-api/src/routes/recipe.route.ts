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
  validate({ body: recipe.registerSchema }),
  recipeController.selectSingle.bind(recipeController),
);

export { recipeRoutes };
