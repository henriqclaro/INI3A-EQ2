import type { NextFunction, Request, Response } from 'express';

import jwt, { type JwtPayload } from 'jsonwebtoken';

import prisma from '../config/database';
import { env } from '../config/env.config';
import { AuthError, GoneError, NotFoundError } from '../responses/http.error';
import { headerSchema } from '../validation/auth.schema';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const validatedHeader = headerSchema.parse(req.headers);

    const [, token] = validatedHeader.authorization.split(' ');

    if (!token) {
      throw new AuthError('Access token missing', 'AUTH_ACCESS_TOKEN_MISSING');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const { id } = decoded;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        isActive: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }

    req.userId = id;
    req.userRole = user.role;

    return next();
  } catch (error) {
    return next(error);
  }
}
