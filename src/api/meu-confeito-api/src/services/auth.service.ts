import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

import prisma from '../config/database';
import { env } from '../config/env.config';
import type { Role } from '../generated/prisma/client';
import { AuthError } from '../responses/http.error';
import type { AuthDTO } from '../types/dtos/auth.dto';

export class AuthService {
  private parseLocation(rawLocation: any) {
    if (rawLocation?.coordinates) {
      const [longitude, latitude] = rawLocation.coordinates;
      return { latitude, longitude };
    }

    return null;
  }

  async logIn(data: AuthDTO.LogInRequest) {
    // eslint-disable-next-line @ts-safeql/check-sql
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        "user".id,
        "user".name,
        "user".phone,
        "user".profile_picture_url as "pfpUrl",
        "user".password_hash as "passwordHash",
        "user".role as role,
        ST_AsGeoJSON(bp.location)::json as location
      FROM "user"
      LEFT JOIN "baker_profile" bp ON bp.user_id = "user".id
      WHERE "user".email = ${data.email}
      LIMIT 1
    `;

    const foundUser = result[0] || null;

    if (!foundUser) {
      throw new AuthError('Invalid credentials', 'AUTH_UNAUTHORIZED');
    }

    if (!foundUser.passwordHash) {
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
      location: this.parseLocation(foundUser.location),
      pfpUrl: foundUser.pfpUrl,
      role: foundUser.role as Role,
    };

    const payload = {
      id: foundUser.id,
      role: foundUser.role as Role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30m' });
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
        expiresIn: 1800,
      },
    };

    if (data.clientType === 'web') {
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
    } else {
      // mobile
      userData.auth.refreshToken = refreshToken;

      return { userData };
    }
  }

  async logOut(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async toRefreshToken(incomingRefreshToken: string) {
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

    const newToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30' });

    const auth = {
      accessToken: newToken,
      tokenType: 'Bearer',
      expiresIn: 1800,
    };

    return { auth };
  }
}
