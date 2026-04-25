import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error.util';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: 'error',
      message: err.message,
    });
  }

  // Adicionar erros aqui

  console.error('Internal Server Error', err);

  return res.status(500).json({
    status: 'error',
    message: 'An internal server error occurred',
  });
}
