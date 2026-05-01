import { type Response, Router } from 'express';

import { UserController } from '../controllers/user.controller';
import type { ApiResponse } from '../types/api.response';
import type { UserDTO } from '../types/dtos/user.dto';

const userRoutes = Router();
const userController = new UserController();

userRoutes.post('/', (req, res: Response<any, ApiResponse<UserDTO.RegisterResponse>>) =>
  userController.register(req, res),
);

export { userRoutes };
