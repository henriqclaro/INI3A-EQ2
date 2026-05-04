import type { NextFunction, Request, Response } from 'express';

import 'dotenv/config';
import jwt from 'jsonwebtoken';

import { headerSchema } from '../validation/auth.schema';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const validatedHeader = headerSchema.parse(req.headers);

  const [, token] = validatedHeader.authorization.split(' ');

  const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as any;
  const { id, role } = decoded;

  req.userId = id;
  req.userRole = role;

  return next();
}
