import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import * as auth from '../validation/auth.schema';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post(
  '/sessions',
  validate({ body: auth.logInSchema }),
  async (req, res) => await authController.logIn(req, res),
);

authRoutes.post(
  '/tokens',
  validate({ body: auth.refreshTokenSchema }),
  async (req, res) => await authController.refreshToken(req, res),
);

export { authRoutes };
