import { Router } from 'express';

import { userRoutes } from './user.route';

const routes = Router();

// Colocar as rotas aqui
routes.use('api/users', userRoutes);

export { routes };
