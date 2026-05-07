import type { NextFunction, Request, Response } from 'express';

import jwt, { type JwtPayload } from 'jsonwebtoken';

import { env } from '../config/env.config';
import { AuthError } from '../responses/http.error';
import { headerSchema } from '../validation/auth.schema';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const validatedHeader = headerSchema.parse(req.headers);

  const [, token] = validatedHeader.authorization.split(' ');

  if (!token) {
    throw new AuthError('Access token missing', 'AUTH_ACCESS_TOKEN_MISSING');
  }

  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  const { id, role } = decoded;

  req.userId = id;
  req.userRole = role;

  return next();
}
