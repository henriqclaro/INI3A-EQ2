import { Router } from 'express';

import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { showcaseRoutes } from '../showcase/showcase.route';
import { BakerProfileController } from './baker-profile.controller';
import * as bakerProfile from './baker-profile.schema';

const bakerProfileRoutes = Router();
const bakerProfileController = new BakerProfileController();

bakerProfileRoutes.use(authMiddleware);

bakerProfileRoutes.get(
  '/',
  validate({ query: bakerProfile.querySchema }),
  bakerProfileController.selectByLocation.bind(bakerProfileController),
);

bakerProfileRoutes.get(
  '/neighborhood',
  validate({ query: bakerProfile.neighborhoodQuerySchema }),
  bakerProfileController.selectByNeighborhood.bind(bakerProfileController),
);

bakerProfileRoutes.post(
  '/me',
  validate({ body: bakerProfile.registerSchema }),
  bakerProfileController.create.bind(bakerProfileController),
);

bakerProfileRoutes.get('/me', bakerProfileController.selectMe.bind(bakerProfileController));

bakerProfileRoutes.patch(
  '/me',
  validate({ body: bakerProfile.updateSchema }),
  bakerProfileController.updateMe.bind(bakerProfileController),
);

bakerProfileRoutes.delete('/me', bakerProfileController.deleteMe.bind(bakerProfileController));

bakerProfileRoutes.use(showcaseRoutes);

bakerProfileRoutes.get(
  '/:id',
  validate({ params: bakerProfile.paramsSchema }),
  bakerProfileController.selectPublic.bind(bakerProfileController),
);

export { bakerProfileRoutes };
