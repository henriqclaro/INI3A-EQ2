import type { NextFunction, Request, Response } from 'express';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { AppError, ValidationError } from '../errors/app.error';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Adicionar erros aqui
  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(err.status).json({
      status: 'validation error',
      message: err.message,
      error: err,
    });
  }

  if (err instanceof PrismaClientKnownRequestError) {
    return res.status(500).json({ err });
  }

  console.error('Internal Server Error', err);

  return res.status(500).json({
    status: 'error',
    message: 'An internal server error occurred',
  });
}
