import { Router } from 'express';

import { IngredientController } from '../controllers/ingredient.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as ingredient from '../validation/ingredient.schema';

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
  ingredientController.serach.bind(ingredientController),
);

export { ingredientRoutes };
