import bcrypt from 'bcrypt';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

import prisma from '../config/database';
import { AuthError } from '../responses/http.error';
import type { AuthDTO } from '../types/dtos/auth.dto';

if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not defined in environment variables');
  throw new Error();
}

const jwtSecret = process.env.JWT_SECRET;

export class AuthService {
  async logIn(clientType: string, data: AuthDTO.LogInRequest) {
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

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
    const refreshToken = randomBytes(40).toString('hex');

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 90);

    await prisma.refreshToken.upsert({
      where: { userId: foundUser.id },
      update: {
        token: refreshToken,
        expiresAt: expireDate,
      },
      create: {
        token: refreshToken,
        userId: foundUser.id,
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

    if (clientType === 'mobile') {
      userData.auth.refreshToken = refreshToken;

      return { userData };
    } else {
      // web
      const cookie = {
        name: 'refreshToken',
        val: refreshToken,
        options: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as 'strict',
          maxAge: 90 * 24 * 60 * 60 * 1000,
        },
      };

      return { userData, cookie };
    }
  }

  async refreshToken(toRefreshToken: string) {
    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: toRefreshToken },
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

    const newToken = jwt.sign(payload, jwtSecret as string, { expiresIn: '1h' });

    return { accessToken: newToken };
  }
}
