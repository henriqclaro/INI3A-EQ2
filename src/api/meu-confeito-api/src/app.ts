import express from 'express';

import cors from 'cors';

import { errorHandler } from './middlewares/error.handler';
import { routes } from './routes';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(routes);

app.use(errorHandler);

export default app;
