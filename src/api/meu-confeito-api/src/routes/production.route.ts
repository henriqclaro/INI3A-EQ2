import { Router } from 'express';

import { ProductionController } from '../controllers/production.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as production from '../validation/production.schema';

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
