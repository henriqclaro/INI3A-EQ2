import { Router } from 'express';

import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as analytics from '../validation/analytics.schema';

const analyticsRoutes = Router();
const analyticsController = new AnalyticsController();

analyticsRoutes.use(authMiddleware);

analyticsRoutes.get(
  '/profit-summary',
  validate({ query: analytics.profitSummaryQuerySchema }),
  analyticsController.getProfitSummary.bind(analyticsController),
);

analyticsRoutes.post(
  '/purchase-projection',
  validate({ body: analytics.purchaseProjectionSchema }),
  analyticsController.projectPurchases.bind(analyticsController),
);

export { analyticsRoutes };
