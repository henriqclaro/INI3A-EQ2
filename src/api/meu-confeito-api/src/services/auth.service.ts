import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { access } from 'node:fs';

import prisma from '../config/database';
import { AuthError } from '../responses/http.error';
import type { AuthDTO } from '../types/dtos/auth.dto';

const jwtSecret = process.env.JWT_SECRET;

export class AuthService {
  async logIn(data: AuthDTO.LogInRequest) {
    const foundUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        name: true,
        phone: true,
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
      pfpUrl: foundUser.pfpUrl,
    };

    const payload = {
      id: foundUser.id,
      role: foundUser.role,
    };

    const token = jwt.sign(payload, jwtSecret as string, { expiresIn: '1h' });

    const userData: AuthDTO.LogInResponse = {
      user,
      auth: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 3600,
      },
    };

    return userData;
  }

  async refreshToken(expiredToken: string) {
    const decoded = jwt.verify(expiredToken, jwtSecret as string) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new AuthError('Error validating token', 'AUTH_TOKEN_INVALID');
    }

    const refreshToken = await prisma.refreshToken.findUnique({
      where: { userId: decoded.id },
      select: { token: true, expiresAt: true },
    });

    if (refreshToken?.token !== expiredToken) {
      throw new AuthError('Error validating token', 'AUTH_TOKEN_INVALID');
    }

    const newToken = jwt.sign({ id: decoded.id }, jwtSecret as string, { expiresIn: '1h' });

    return { accessToken: newToken };
  }
}
