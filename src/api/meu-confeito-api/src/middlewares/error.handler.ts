import type { NextFunction, Request, Response } from 'express';

import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { ZodError, z } from 'zod';

import { AppError } from '../responses/app.error';
import { InternalError, NotFoundError } from '../responses/http.error';

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

  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
    const notFoundError = new NotFoundError();

    return res.status(notFoundError.statusCode).json({
      status: notFoundError.status,
      message: notFoundError.message,
      code: notFoundError.errorCode,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'fail',
        message: 'File size exceeds maximum limit of 5MB',
        code: 'PAYLOAD_TOO_LARGE',
      });
    }

    return res.status(400).json({
      status: 'fail',
      message: err.message,
      code: 'INVALID_FORMAT',
    });
  }

  // Adicionar erros operacionais acima desse comentário, e não-operacionais abaixo

  const reqIdPrefix = _req.id ? `[${_req.id}] ` : '';

  if (err instanceof PrismaClientKnownRequestError || err instanceof PrismaClientValidationError) {
    console.error(`${reqIdPrefix}Internal Prisma Error: `, err);

    const internalError = new InternalError();

    return res.status(internalError.statusCode).json({
      status: internalError.status,
      message: internalError.message,
      code: internalError.errorCode,
    });
  }

  console.error(`${reqIdPrefix}Internal Server Error: `, err);

  const internalError = new InternalError();

  return res.status(internalError.statusCode).json({
    status: internalError.status,
    message: internalError.message,
    code: internalError.errorCode,
  });
}
