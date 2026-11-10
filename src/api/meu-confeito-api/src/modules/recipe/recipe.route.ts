import { Router } from 'express';

import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { createRecipeHourlyRateLimiter } from '../../core/middlewares/rate-limit.middleware';
import { uploadCoverMiddleware } from '../../core/middlewares/upload.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { RecipeController } from './recipe.controller';
import * as recipe from './recipe.schema';

const recipeRoutes = Router();
const recipeController = new RecipeController();

recipeRoutes.use(authMiddleware);

recipeRoutes.post(
  '/',
  createRecipeHourlyRateLimiter,
  validate({ body: recipe.registerSchema }),
  recipeController.register.bind(recipeController),
);

recipeRoutes.get(
  '/',
  validate({ query: recipe.querySchema }),
  recipeController.search.bind(recipeController),
);

recipeRoutes.get(
  '/:id',
  validate({ params: recipe.paramsSchema }),
  recipeController.selectSingle.bind(recipeController),
);

recipeRoutes.get(
  '/:id/inventory',
  validate({ params: recipe.paramsSchema }),
  recipeController.selectMyInventory.bind(recipeController),
);

recipeRoutes.get(
  '/:id/users/:userId',
  validate({ params: recipe.userInventoryParamsSchema }),
  recipeController.selectSingleUserInventory.bind(recipeController),
);

recipeRoutes.patch(
  '/:id/visibility',
  validate({ params: recipe.paramsSchema, body: recipe.updateVisibilitySchema }),
  recipeController.updateVisibility.bind(recipeController),
);

// Rotas de Capa / Storage ------------------------

recipeRoutes.patch(
  '/:id/cover',
  validate({ params: recipe.paramsSchema }),
  uploadCoverMiddleware,
  recipeController.uploadCover.bind(recipeController),
);

recipeRoutes.delete(
  '/:id/cover',
  validate({ params: recipe.paramsSchema }),
  recipeController.deleteCover.bind(recipeController),
);

recipeRoutes.patch(
  '/:id',
  validate({ params: recipe.paramsSchema, body: recipe.updateSchema }),
  recipeController.update.bind(recipeController),
);

recipeRoutes.delete(
  '/:id',
  validate({ params: recipe.paramsSchema }),
  recipeController.delete.bind(recipeController),
);

recipeRoutes.get(
  '/:id/reviews',
  validate({ params: recipe.paramsSchema }),
  recipeController.selectRecipeReviews.bind(recipeController),
);

recipeRoutes.post(
  '/:id/reviews',
  validate({ params: recipe.paramsSchema, body: recipe.createReviewSchema }),
  recipeController.createReview.bind(recipeController),
);

recipeRoutes.patch(
  '/:id/reviews',
  validate({ params: recipe.paramsSchema, body: recipe.updateReviewSchema }),
  recipeController.updateReview.bind(recipeController),
);

recipeRoutes.delete(
  '/:id/reviews',
  validate({ params: recipe.paramsSchema }),
  recipeController.deleteReview.bind(recipeController),
);

export { recipeRoutes };
