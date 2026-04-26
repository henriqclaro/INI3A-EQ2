import type { NextFunction, Request, Response } from 'express';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ZodError, z } from 'zod';

import { AppError } from '../errors/api.error';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.name,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'ValidationError',
      message: z.prettifyError(err),
      errors: z.treeifyError(err),
    });
  }

  // Adicionar erros acima desse comentário

  if (err instanceof PrismaClientKnownRequestError) {
    console.error('Internal Prisma Error: ', err);

    return res.status(500).json({
      status: 'error',
      message: 'An internal server error occurred',
    });
  }

  console.error('Internal Server Error: ', err);

  return res.status(500).json({
    status: 'error',
    message: 'An internal server error occurred',
  });
}
