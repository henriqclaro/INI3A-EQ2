import bcrypt from 'bcrypt';

import prisma from '../config/database';
import { env } from '../config/env.config';
import type { UserModel } from '../generated/prisma/models';
import { ConflictError, ForbiddenError, GoneError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { UserDTO } from '../types/dtos/user.dto';

export class UserService {
  private checkPermission(context: RequestContext, id: string) {
    if (context.userId !== id && context.userRole !== 'ADMIN') {
      throw new ForbiddenError('Action denied for lack of privileges');
    }
  }

  private checkUser(
    user: Pick<UserModel, 'isActive'> | null,
  ): asserts user is Pick<UserModel, 'isActive'> {
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }
  }

  // Queries de CRUD ------------------------

  async register(data: UserDTO.RegisterRequest) {
    const userExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (userExists) {
      throw new ConflictError('Email already in use', 'USER_ALREADY_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return { user };
  }

  async select(context: RequestContext, id: string) {
    this.checkPermission(context, id);

    // eslint-disable-next-line @ts-safeql/check-sql
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        name,
        email,
        phone,
        profile_picture_url as "pfpUrl",
        role as "roleType",
        updated_at as "updatedAt",
        is_active as "isActive",
        ST_AsGeoJSON(location)::json as location
      FROM "user"
      WHERE id = ${id}
      LIMIT 1
    `;

    const user = result[0] || null;

    this.checkUser(user);

    return { user };
  }

  async update(context: RequestContext, id: string, data: UserDTO.UpdateRequest) {
    this.checkPermission(context, id);

    if (data.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailInUse && emailInUse.id !== id) {
        throw new ConflictError('Email already in use', 'USER_ALREADY_EXISTS');
      }
    }

    const { location, ...standartData } = data;

    const updatedUser = prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: id },
        select: { isActive: true },
      });

      this.checkUser(existingUser);

      let user = null;

      if (Object.keys(standartData).length > 0) {
        user = await tx.user.update({
          where: { id: id },
          data: standartData,
          select: {
            name: true,
            email: true,
            phone: true,
            pfpUrl: true,
            updatedAt: true,
            isActive: true,
          },
        });
      } else {
        user = await tx.user.findUnique({
          where: { id: id },
          select: {
            name: true,
            email: true,
            phone: true,
            pfpUrl: true,
            updatedAt: true,
            isActive: true,
          },
        });
      }

      if (location) {
        await tx.$executeRaw`
         UPDATE "user"
         SET
          location = ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326),
          updated_at = NOW()
         WHERE id = ${id}::uuid
        `;
      }

      if (user) {
        user.updatedAt = new Date();
      }

      return user;
    });

    return { updatedUser };
  }

  async delete(context: RequestContext, id: string, data: UserDTO.DeleteRequest) {
    this.checkPermission(context, id);

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        isActive: true,
      },
    });

    this.checkUser(user);

    const isSuspended = data.state === 'SUSPENDED';
    const stateString = data.state.toLocaleLowerCase();

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({
        where: { userId: id },
      });

      await tx.user.update({
        where: { id: id },
        data: {
          isActive: false,

          name: `${stateString}_user`,
          email: isSuspended ? undefined : `${stateString}_${id}@anonymized.local`,
          phone: isSuspended ? undefined : null,
          pfpUrl: null,
          providerId: null,
          passwordHash: 'DELETED',
        },
      });

      await tx.$executeRaw`
        UPDATE "user"
        SET location = NULL
        WHERE id = ${id}::uuid
      `;
    });
  }

  // Queries de Relações ------------------------

  async selectUserRecipe(context: RequestContext, id: string) {
    this.checkPermission(context, id);

    const recipes = await prisma.recipe.findMany({
      where: { userId: id },
      take: 10,
      select: {
        id: true,
        title: true,
        coverUrl: true,

        /*
        profitMargin: true,
        overhead: true,
        hourlyLabor: true,
        packagingCost: true,
        */
        prepTimeMinutes: true,

        createdAt: true,
        updatedAt: true,

        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return { recipes };
  }

  async selectUserSaves(context: RequestContext, id: string) {
    this.checkPermission(context, id);

    const userSaves = await prisma.userSavedRecipe.findMany({
      where: { userId: id },
      take: 10,
      select: {
        savedAt: true,

        recipe: {
          select: {
            id: true,
            title: true,
            coverUrl: true,

            profitMargin: true,
            overhead: true,
            hourlyLabor: true,
            packagingCost: true,

            tags: {
              select: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return { userSaves };
  }
}
