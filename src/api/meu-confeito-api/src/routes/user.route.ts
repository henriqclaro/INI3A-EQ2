import { Router } from 'express';

import { UserController } from '../controllers/user.controller';

const userRoutes = Router();
const userController = new UserController();

userRoutes.post('/', (req, res) => userController.register(req, res));

export { userRoutes };
