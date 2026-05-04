import type { NextFunction, Request, Response } from 'express';

import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import jwt from 'jsonwebtoken';
import { ZodError, z } from 'zod';

import { AppError } from '../responses/app.error';

export function errorHandler(err: Error, _req: Request, res: Response, __next: NextFunction) {
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

  if (err instanceof jwt.JsonWebTokenError) {
    console.error(err);

    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token',
      code: 'AUTH_TOKEN_INVALID',
    });
  }

  if (err instanceof jwt.TokenExpiredError) {
    console.error(err);

    return res.status(401).json({
      status: 'fail',
      message: 'Session invalid or expired: Log in again',
      code: 'AUTH_TOKEN_EXPIRED',
    });
  }

  // Adicionar erros operacionais acima desse comentário, e não-operacionais abaixo

  if (err instanceof PrismaClientKnownRequestError || err instanceof PrismaClientValidationError) {
    console.error('Internal Prisma Error: ', err);

    return res.status(500).json({
      status: 'error',
      message: 'An internal server error occurred',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }

  console.error('Internal Server Error: ', err);

  return res.status(500).json({
    status: 'error',
    message: 'An internal server error occurred',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
