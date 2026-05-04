import { type Response, Router } from 'express';

import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import * as user from '../validation/user.schema';

const userRoutes = Router();
const userController = new UserController();

userRoutes.post('/', validate({ body: user.registerSchema }), (req, res) =>
  userController.register(req, res),
);

export { userRoutes };
