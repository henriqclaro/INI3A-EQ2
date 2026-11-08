import { Router } from 'express';

import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { InventoryController } from './inventory.controller';
import * as inventory from './inventory.schema';

const inventoryRoutes = Router();
const inventoryController = new InventoryController();

inventoryRoutes.use(authMiddleware);

inventoryRoutes.get('/', inventoryController.list.bind(inventoryController));

inventoryRoutes.get(
  '/transactions',
  validate({ query: inventory.transactionQuerySchema }),
  inventoryController.listTransactions.bind(inventoryController),
);

inventoryRoutes.get(
  '/:ingredientId',
  validate({ params: inventory.paramsSchema }),
  inventoryController.selectByIngredient.bind(inventoryController),
);

inventoryRoutes.post(
  '/purchases',
  validate({ body: inventory.purchaseSchema }),
  inventoryController.registerPurchase.bind(inventoryController),
);

inventoryRoutes.post(
  '/adjustments',
  validate({ body: inventory.adjustmentSchema }),
  inventoryController.registerAdjustment.bind(inventoryController),
);

inventoryRoutes.post(
  '/waste',
  validate({ body: inventory.wasteSchema }),
  inventoryController.registerWaste.bind(inventoryController),
);

export { inventoryRoutes };
