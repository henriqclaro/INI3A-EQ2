import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

import prisma from '../config/database';
import { env } from '../config/env.config';
import { AuthError } from '../responses/http.error';
import type { AuthDTO } from '../types/dtos/auth.dto';

export class AuthService {
  async logIn(data: AuthDTO.LogInRequest) {
    const foundUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        name: true,
        phone: true,
        // location: true,
        pfpUrl: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!foundUser) {
      throw new AuthError('Invalid credentials', 'AUTH_UNAUTHORIZED');
    }

    const isPassValid = await bcrypt.compare(data.password, foundUser.passwordHash);

    if (!isPassValid) {
      throw new AuthError('Invalid credentials', 'AUTH_UNAUTHORIZED');
    }

    const user = {
      id: foundUser.id,
      name: foundUser.name,
      email: data.email,
      phone: foundUser.phone,
      // location: foundUser.location,
      pfpUrl: foundUser.pfpUrl,
      role: foundUser.role,
    };

    const payload = {
      id: foundUser.id,
      role: foundUser.role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = randomBytes(40).toString('hex');

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + env.RT_TTL_DAYS);

    await prisma.refreshToken.upsert({
      where: { userId_sessionId: { userId: foundUser.id, sessionId: data.sessionId } },
      update: {
        token: refreshToken,
        expiresAt: expireDate,
      },
      create: {
        token: refreshToken,
        userId: foundUser.id,
        sessionId: data.sessionId,
        expiresAt: expireDate,
      },
    });

    const userData: AuthDTO.LogInResponse = {
      user,
      auth: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
    };

    if (data.clientType === 'mobile') {
      userData.auth.refreshToken = refreshToken;

      return { userData };
    } else {
      // web
      const cookie = {
        name: 'refreshToken',
        val: refreshToken,
        options: {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          sameSite: 'strict' as 'strict',
          maxAge: env.RT_TTL_DAYS * 24 * 60 * 60 * 1000,
        },
      };

      return { userData, cookie };
    }
  }

  async refreshToken(incomingRefreshToken: string) {
    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: incomingRefreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AuthError('Error validating token', 'AUTH_TOKEN_INVALID');
    }

    if (new Date() > storedToken.expiresAt) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      throw new AuthError('Session expired. Log in again', 'AUTH_TOKEN_EXPIRED');
    }

    const payload = {
      id: storedToken.user.id,
      role: storedToken.user.role,
    };

    const newToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });

    return { accessToken: newToken };
  }
}
