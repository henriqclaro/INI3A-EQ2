import { type Response, Router } from 'express';

import { UserController } from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import type { ApiResponse } from '../types/api.response';
import type { UserDTO } from '../types/dtos/user.dto';
import * as user from '../validation/user.schema';

const userRoutes = Router();
const userController = new UserController();

userRoutes.post(
  '/',
  validate({ body: user.registerSchema }),
  (req, res: Response<any, ApiResponse<UserDTO.RegisterResponse>>) =>
    userController.register(req, res),
);

export { userRoutes };
