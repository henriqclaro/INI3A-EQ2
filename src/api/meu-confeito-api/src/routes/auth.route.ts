import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import * as auth from '../validation/auth.schema';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/sessions', validate({ body: auth.logInSchema }), (req, res) =>
  authController.logIn(req, res),
);

authRoutes.post('/tokens', validate({ body: auth.refreshTokenSchema }), (req, res) =>
  authController.refreshToken(req, res),
);

export { authRoutes };
