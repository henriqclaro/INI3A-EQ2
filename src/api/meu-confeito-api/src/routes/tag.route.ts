import { Router } from 'express';

import { TagController } from '../controllers/tag.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as tag from '../validation/tag.schema';

const tagRoutes = Router();
const tagController = new TagController();

tagRoutes.use(authMiddleware);

tagRoutes.post(
  '/',
  validate({ body: tag.registerSchema }),
  tagController.register.bind(tagController),
);

tagRoutes.get('/', validate({ query: tag.querySchema }), tagController.search.bind(tagController));

export { tagRoutes };
