import { Router } from 'express';

import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { ShowcaseController } from './showcase.controller';
import * as showcase from './showcase.schema';

const showcaseRoutes = Router();
const showcaseController = new ShowcaseController();

showcaseRoutes.use(authMiddleware);

showcaseRoutes.get('/me/showcase', showcaseController.listMine.bind(showcaseController));

showcaseRoutes.post(
  '/me/showcase',
  validate({ body: showcase.addShowcaseSchema }),
  showcaseController.add.bind(showcaseController),
);

showcaseRoutes.patch(
  '/me/showcase/order',
  validate({ body: showcase.reorderShowcaseSchema }),
  showcaseController.reorder.bind(showcaseController),
);

showcaseRoutes.delete(
  '/me/showcase/:recipeId',
  validate({ params: showcase.paramsRecipeSchema }),
  showcaseController.remove.bind(showcaseController),
);

showcaseRoutes.get(
  '/:id/showcase',
  validate({ params: showcase.paramsProfileSchema }),
  showcaseController.listPublic.bind(showcaseController),
);

export { showcaseRoutes };
