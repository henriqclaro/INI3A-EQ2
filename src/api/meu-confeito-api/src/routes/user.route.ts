import { Router } from 'express';

import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { uploadAvatarMiddleware } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as user from '../validation/user.schema';

const userRoutes = Router();
const userController = new UserController();

// Rotas de CRUD ------------------------

userRoutes.post(
  '/',
  validate({ body: user.registerSchema }),
  userController.register.bind(userController),
);

userRoutes.use(authMiddleware);

// Rotas de Avatar / Storage ------------------------

userRoutes.patch(
  '/me/avatar',
  uploadAvatarMiddleware,
  userController.uploadMyAvatar.bind(userController),
);

userRoutes.delete('/me/avatar', userController.deleteMyAvatar.bind(userController));

userRoutes.patch(
  '/:id/avatar',
  validate({ params: user.paramsSchema }),
  uploadAvatarMiddleware,
  userController.uploadUserAvatar.bind(userController),
);

userRoutes.delete(
  '/:id/avatar',
  validate({ params: user.paramsSchema }),
  userController.deleteUserAvatar.bind(userController),
);

userRoutes.get(
  '/:id',
  validate({ params: user.paramsSchema }),
  userController.select.bind(userController),
);

userRoutes.patch(
  '/:id',
  validate({ params: user.paramsSchema, body: user.updateSchema }),
  userController.update.bind(userController),
);

userRoutes.delete(
  '/:id',
  validate({ params: user.paramsSchema, body: user.deleteSchema }),
  userController.delete.bind(userController),
);

// Rotas de Relações ------------------------

userRoutes.get(
  '/:id/recipes',
  validate({ params: user.paramsSchema, query: user.recipeQuerySchema }),
  userController.selectUserRecipe.bind(userController),
);

userRoutes.get(
  '/:id/saves',
  validate({ params: user.paramsSchema }),
  userController.selectUserSaves.bind(userController),
);

userRoutes.post(
  '/:id/saves',
  validate({ params: user.paramsSchema, body: user.saveRecipeSchema }),
  userController.saveRecipe.bind(userController),
);

userRoutes.delete(
  '/:id/saves',
  validate({ params: user.paramsSchema, body: user.removeSaveRecipeSchema }),
  userController.removeSaveRecipe.bind(userController),
);

userRoutes.get(
  '/:id/reviews',
  validate({ params: user.paramsSchema }),
  userController.selectUserReviews.bind(userController),
);

export { userRoutes };
