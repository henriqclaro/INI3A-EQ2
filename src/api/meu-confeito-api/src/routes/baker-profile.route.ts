import { Router } from 'express';

import { BakerProfileController } from '../controllers/baker-profile.controller';
import { ShowcaseController } from '../controllers/showcase.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as bakerProfile from '../validation/baker-profile.schema';
import * as showcase from '../validation/showcase.schema';

const bakerProfileRoutes = Router();
const bakerProfileController = new BakerProfileController();
const showcaseController = new ShowcaseController();

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

bakerProfileRoutes.get('/me/showcase', showcaseController.listMine.bind(showcaseController));

bakerProfileRoutes.post(
  '/me/showcase',
  validate({ body: showcase.addShowcaseSchema }),
  showcaseController.add.bind(showcaseController),
);

bakerProfileRoutes.patch(
  '/me/showcase/order',
  validate({ body: showcase.reorderShowcaseSchema }),
  showcaseController.reorder.bind(showcaseController),
);

bakerProfileRoutes.delete(
  '/me/showcase/:recipeId',
  validate({ params: showcase.paramsRecipeSchema }),
  showcaseController.remove.bind(showcaseController),
);

bakerProfileRoutes.get(
  '/:id/showcase',
  validate({ params: showcase.paramsProfileSchema }),
  showcaseController.listPublic.bind(showcaseController),
);

bakerProfileRoutes.get(
  '/:id',
  validate({ params: bakerProfile.paramsSchema }),
  bakerProfileController.selectPublic.bind(bakerProfileController),
);

export { bakerProfileRoutes };
