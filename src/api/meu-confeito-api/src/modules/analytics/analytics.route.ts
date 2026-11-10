import { Router } from 'express';

import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { AnalyticsController } from './analytics.controller';
import * as analytics from './analytics.schema';

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
