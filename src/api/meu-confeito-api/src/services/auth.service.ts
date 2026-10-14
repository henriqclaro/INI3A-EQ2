import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

import prisma from '../config/database';
import { env } from '../config/env.config';
import type { Prisma, Role } from '../generated/prisma/client';
import { AuthError, DefaultAppError, GoneError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { AuthDTO } from '../types/dtos/auth.dto';

export class AuthService {
  private parseLocation(rawLocation: any) {
    if (rawLocation?.coordinates) {
      const [longitude, latitude] = rawLocation.coordinates;
      return { latitude, longitude };
    }

    return null;
  }

  async purgeExpiredTokens(client: Prisma.TransactionClient | typeof prisma = prisma) {
    await client.refreshToken.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });
  }

  private async enforceActiveTokensLimit(tx: Prisma.TransactionClient, userId: string) {
    const activeTokens = await tx.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (activeTokens.length > env.MAX_ACTIVE_TOKENS) {
      const tokensToDelete = activeTokens.slice(env.MAX_ACTIVE_TOKENS).map((t) => t.id);
      await tx.refreshToken.deleteMany({
        where: {
          id: { in: tokensToDelete },
        },
      });
    }
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
        "user".updated_at as "updatedAt",
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
      updatedAt: foundUser.updatedAt,
    };

    const payload = {
      id: foundUser.id,
      role: foundUser.role as Role,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30m' });
    const refreshToken = randomBytes(40).toString('hex');

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + env.RT_TTL_DAYS);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await this.purgeExpiredTokens(tx);

      await tx.refreshToken.upsert({
        where: { userId_sessionId: { userId: foundUser.id, sessionId: data.sessionId } },
        update: {
          token: refreshToken,
          expiresAt: expireDate,
          createdAt: now,
        },
        create: {
          token: refreshToken,
          userId: foundUser.id,
          sessionId: data.sessionId,
          expiresAt: expireDate,
          createdAt: now,
        },
      });

      await this.enforceActiveTokensLimit(tx, foundUser.id);
    });

    const userData: AuthDTO.LogInResponse = {
      user,
      auth: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 1800,
      },
    };

    userData.auth.refreshToken = refreshToken;

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
    }

    return { userData };
  }

  async logOut(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    await this.purgeExpiredTokens();
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
      await this.purgeExpiredTokens();

      throw new AuthError('Session expired. Log in again', 'AUTH_TOKEN_EXPIRED');
    }

    await this.purgeExpiredTokens();

    const payload = {
      id: storedToken.user.id,
      role: storedToken.user.role,
    };

    const newToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30m' });

    const auth = {
      accessToken: newToken,
      tokenType: 'Bearer',
      expiresIn: 1800,
    };

    return { auth };
  }

  async resetPassword(context: RequestContext, data: AuthDTO.ResetPasswordRequest) {
    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: {
        id: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }

    if (!user.passwordHash) {
      throw new AuthError('User has no password set', 'AUTH_UNAUTHORIZED');
    }

    const isPassValid = await bcrypt.compare(data.oldPassword, user.passwordHash);

    if (!isPassValid) {
      throw new DefaultAppError('Invalid old password', 'USER_INVALID_PASSWORD');
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, env.BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: context.userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });
  }
}
