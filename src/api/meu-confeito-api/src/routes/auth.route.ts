import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as auth from '../validation/auth.schema';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post(
  '/sessions',
  authRateLimiter,
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
  authRateLimiter,
  validate({ body: auth.refreshOrDeleteSchema }),
  authController.toRefreshToken.bind(authController),
);

authRoutes.patch(
  '/password',
  authMiddleware,
  authRateLimiter,
  validate({ body: auth.resetPasswordSchema }),
  authController.resetPassword.bind(authController),
);

export { authRoutes };
