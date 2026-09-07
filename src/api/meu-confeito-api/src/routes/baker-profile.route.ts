import { Router } from 'express';

import { BakerProfileController } from '../controllers/baker-profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as bakerProfile from '../validation/baker-profile.schema';

const bakerProfileRoutes = Router();
const bakerProfileController = new BakerProfileController();

bakerProfileRoutes.use(authMiddleware);

bakerProfileRoutes.get(
  '/',
  validate({ query: bakerProfile.querySchema }),
  bakerProfileController.selectByLocation.bind(bakerProfileController),
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

bakerProfileRoutes.get(
  '/:id',
  validate({ params: bakerProfile.paramsSchema }),
  bakerProfileController.selectPublic.bind(bakerProfileController),
);

export { bakerProfileRoutes };
