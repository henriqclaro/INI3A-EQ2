import express from 'express';

import cors from 'cors';

import { setupSwagger } from './config/swagger.config';
import { errorHandler } from './middlewares/error.handler';
import { NotFoundError } from './responses/http.error';
import { routes } from './routes';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use('/api/v1', routes);

setupSwagger(app);

app.use((req, _res) => {
  throw new NotFoundError(`Route ${req.originalUrl} does not exist`, 'ROUTE_DOES_NOT_EXIST');
});

app.use(errorHandler);

export default app;
