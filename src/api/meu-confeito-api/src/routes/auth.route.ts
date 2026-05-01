import { type Response, Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import type { ApiResponse } from '../types/api.response';
import type { AuthDTO } from '../types/dtos/auth.dto';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/sessions', (req, res: Response<any, ApiResponse<AuthDTO.LogInResponse>>) =>
  authController.logIn(req, res),
);

export { authRoutes };
