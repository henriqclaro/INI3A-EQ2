import { Router } from 'express';

import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import * as user from '../validation/user.schema';

const userRoutes = Router();
const userController = new UserController();

userRoutes.post(
  '/',
  validate({ body: user.registerSchema }),
  async (req, res) => await userController.register(req, res),
);

userRoutes.get('/:id', validate({ params: user.paramsSchema }), async (req, res) => {
  await userController.select(req, res);
});

userRoutes.patch(
  '/:id',
  validate({ params: user.paramsSchema, body: user.updateSchema }),
  async (req, res) => {
    await userController.update(req, res);
  },
);

userRoutes.delete(
  '/:id',
  validate({ params: user.paramsSchema, body: user.deleteSchema }),
  async (req, res) => {
    await userController.delete(req, res);
  },
);

export { userRoutes };
