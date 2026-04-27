import express from 'express';

import cors from 'cors';

import { NotFoundError } from './errors/http.error';
import { errorHandler } from './middlewares/error.handler';
import { routes } from './routes';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(routes);

app.all(/(.*)/, (req, _res) => {
  throw new NotFoundError(`Route ${req.originalUrl} does not exist.`, 'ROUTE_DOES_NOT_EXIST');
});

app.use(errorHandler);1

export default app;
