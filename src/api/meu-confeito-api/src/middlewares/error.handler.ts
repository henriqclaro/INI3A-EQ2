import type { NextFunction, Request, Response } from 'express';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ZodError, z } from 'zod';

import { AppError } from '../errors/app.error';

export function errorHandler(err: Error, _: Request, res: Response, __: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.errorCode,
    });
  }

  if (err instanceof ZodError) {
    console.error(z.treeifyError(err));
    console.error(z.prettifyError(err));

    return res.status(400).json({
      status: 'fail',
      message: 'Bad Request: Invalid format',
      code: 'INVALID_FORMAT',
    });
  }

  // Adicionar erros operacionais acima desse comentário, e não-operacionais abaixo

  if (err instanceof PrismaClientKnownRequestError) {
    console.error('Internal Prisma Error: ', err);

    return res.status(500).json({
      status: 'error',
      message: 'An internal server error occurred',
      code: 'DATABASE_CONNECTION_FAILED',
    });
  }

  console.error('Internal Server Error: ', err);

  return res.status(500).json({
    status: 'error',
    message: 'An internal server error occurred',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
