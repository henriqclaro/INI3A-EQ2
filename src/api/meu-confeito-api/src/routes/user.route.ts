import { Router } from 'express';

import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as user from '../validation/user.schema';

const userRoutes = Router();
const userController = new UserController();

userRoutes.post(
  '/',
  validate({ body: user.registerSchema }),
  userController.register.bind(userController),
);

userRoutes.use(authMiddleware);

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

export { userRoutes };
