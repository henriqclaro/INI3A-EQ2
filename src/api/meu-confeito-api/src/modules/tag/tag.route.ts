import { Router } from 'express';

import { authMiddleware } from '../../core/middlewares/auth.middleware';
import { validate } from '../../core/middlewares/validate.middleware';
import { TagController } from './tag.controller';
import * as tag from './tag.schema';

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
