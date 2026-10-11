import express from 'express';

import cors from 'cors';

import { STORAGE_ROOT } from './config/storage.config';
import { setupSwagger } from './config/swagger.config';
import { errorHandler } from './middlewares/error.handler';
import { NotFoundError } from './responses/http.error';
import { routes } from './routes';

const app = express();

app.use(cors());

app.use(
  '/storage',
  express.static(STORAGE_ROOT, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    immutable: true,
    dotfiles: 'ignore',
    etag: true,
    lastModified: true,
  }),
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

setupSwagger(app);

app.use((req, _res) => {
  throw new NotFoundError(`Route ${req.originalUrl} does not exist`, 'ROUTE_DOES_NOT_EXIST');
});

app.use(errorHandler);

export default app;
