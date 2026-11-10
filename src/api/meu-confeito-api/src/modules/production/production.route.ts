import { Router } from 'express';

import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { ProductionController } from './production.controller';
import * as production from './production.schema';

const productionRoutes = Router();
const productionController = new ProductionController();

productionRoutes.use(authMiddleware);

productionRoutes.get(
  '/',
  validate({ query: production.querySchema }),
  productionController.list.bind(productionController),
);

productionRoutes.get(
  '/:id',
  validate({ params: production.paramsSchema }),
  productionController.selectSingle.bind(productionController),
);

productionRoutes.post(
  '/',
  validate({ body: production.registerProductionSchema }),
  productionController.register.bind(productionController),
);

productionRoutes.post(
  '/:id/cancel',
  validate({ params: production.paramsSchema }),
  productionController.cancel.bind(productionController),
);

export { productionRoutes };
