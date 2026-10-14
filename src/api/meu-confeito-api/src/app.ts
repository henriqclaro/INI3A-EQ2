import express from 'express';

import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';

import { STORAGE_ROOT } from './config/storage.config';
import { setupSwagger } from './config/swagger.config';
import { errorHandler } from './middlewares/error.handler';
import { requestLoggerMiddleware } from './middlewares/logger.middleware';
import { globalRateLimiter } from './middlewares/rate-limit.middleware';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { NotFoundError } from './responses/http.error';
import { routes } from './routes';

const app = express();

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(cors());

app.use(hpp());

app.use(compression());

app.use(requestIdMiddleware);

app.use(requestLoggerMiddleware);

app.use(
  '/storage',
  express.static(STORAGE_ROOT, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    immutable: false,
    dotfiles: 'ignore',
    etag: true,
    lastModified: true,
  }),
);

app.use(express.json({ limit: '1mb' }));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api/v1', globalRateLimiter, routes);

setupSwagger(app);

app.use((req, _res) => {
  throw new NotFoundError(`Route ${req.originalUrl} does not exist`, 'ROUTE_DOES_NOT_EXIST');
});

app.use(errorHandler);

export default app;
