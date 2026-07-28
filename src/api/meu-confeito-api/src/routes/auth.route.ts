import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import * as auth from '../validation/auth.schema';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post(
  '/sessions',
  validate({ body: auth.logInSchema }),
  authController.logIn.bind(authController),
);

authRoutes.delete(
  '/sessions',
  validate({ body: auth.refreshOrDeleteSchema }),
  authController.logOut.bind(authController),
);

authRoutes.post(
  '/tokens',
  validate({ body: auth.refreshOrDeleteSchema }),
  authController.toRefreshToken.bind(authController),
);

export { authRoutes };
