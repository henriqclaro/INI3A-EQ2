import { Router } from 'express';

import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { IngredientController } from './ingredient.controller';
import * as ingredient from './ingredient.schema';

const ingredientRoutes = Router();
const ingredientController = new IngredientController();

ingredientRoutes.use(authMiddleware);

ingredientRoutes.post(
  '/',
  validate({ body: ingredient.registerSchema }),
  ingredientController.register.bind(ingredientController),
);

ingredientRoutes.get(
  '/',
  validate({ query: ingredient.querySchema }),
  ingredientController.search.bind(ingredientController),
);

ingredientRoutes.get(
  '/:id',
  validate({ params: ingredient.paramsSchema }),
  ingredientController.selectSingle.bind(ingredientController),
);

export { ingredientRoutes };
