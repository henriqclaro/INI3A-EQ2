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

  private checkUser<T extends Pick<UserModel, 'isActive'>>(user: T | null): asserts user is T {
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new GoneError('User suspended or deleted', 'USER_ACCOUNT_GONE');
    }
  }

  private parseLocation(rawLocation: any) {
    if (rawLocation) {
      const [longitude, latitude] = rawLocation.coordinates;
      return { latitude, longitude };
    }

    return null;
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

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
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

      if (data.role === 'BAKER') {
        await tx.bakerProfile.create({
          data: {
            userId: createdUser.id,
          },
        });
      }

      return createdUser;
    });

    return { user };
  }

  async select(context: RequestContext, id: string) {
    this.checkPermission(context, id);

    // eslint-disable-next-line @ts-safeql/check-sql
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        "user".id,
        "user".name,
        "user".email,
        "user".phone,
        "user".profile_picture_url as "pfpUrl",
        "user".role as role,
        "user".updated_at as "updatedAt",
        "user".is_active as "isActive",
        bp.bio,
        bp.instagram,
        bp.neighborhood,
        bp.city,
        ST_AsGeoJSON(bp.location)::json as location
      FROM "user"
      LEFT JOIN "baker_profile" bp ON bp.user_id = "user".id
      WHERE "user".id = ${id}
      LIMIT 1
    `;

    const rawUser = result[0] || null;

    this.checkUser(rawUser);

    const parsedLocation = this.parseLocation(rawUser.location);

    const user = {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      phone: rawUser.phone,
      bio: rawUser.bio,
      instagram: rawUser.instagram,
      neighborhood: rawUser.neighborhood,
      city: rawUser.city,
      pfpUrl: rawUser.pfpUrl,
      role: rawUser.role,
      updatedAt: rawUser.updatedAt,
      isActive: rawUser.isActive,
      location: parsedLocation,
    };

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

    const { location, bio, instagram, neighborhood, city, ...userData } = data;

    const profileData = {
      ...(bio !== undefined && { bio }),
      ...(instagram !== undefined && { instagram }),
      ...(neighborhood !== undefined && { neighborhood }),
      ...(city !== undefined && { city }),
    };

    const rawUpdatedUser: any = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id: id },
        select: { isActive: true },
      });

      this.checkUser(existingUser);

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: id },
          data: userData,
        });
      }

      if (Object.keys(profileData).length > 0) {
        await tx.bakerProfile.upsert({
          where: { userId: id },
          update: profileData,
          create: {
            userId: id,
            ...profileData,
          },
        });
      }

      if (location !== undefined) {
        if (location === null) {
          await tx.$executeRaw`
            UPDATE "baker_profile"
            SET location = NULL, updated_at = NOW()
            WHERE user_id = ${id}
          `;
        } else {
          await tx.bakerProfile.upsert({
            where: { userId: id },
            update: {},
            create: { userId: id },
          });

          await tx.$executeRaw`
            UPDATE "baker_profile"
            SET
              location = ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326),
              updated_at = NOW()
            WHERE user_id = ${id}
          `;
        }
      }

      const result = await tx.$queryRaw<any[]>`
        SELECT 
          "user".id, 
          "user".name, 
          "user".email, 
          "user".phone, 
          "user".profile_picture_url as "pfpUrl", 
          "user".role as "role", 
          "user".updated_at as "updatedAt", 
          "user".is_active as "isActive",
          bp.bio,
          bp.instagram,
          bp.neighborhood,
          bp.city,
          ST_AsGeoJSON(bp.location)::json as location
        FROM "user"
        LEFT JOIN "baker_profile" bp ON bp.user_id = "user".id
        WHERE "user".id = ${id}
        LIMIT 1
      `;

      return result[0];
    });

    const parsedLocation = this.parseLocation(rawUpdatedUser.location);

    const user = {
      id: rawUpdatedUser.id,
      name: rawUpdatedUser.name,
      email: rawUpdatedUser.email,
      phone: rawUpdatedUser.phone,
      bio: rawUpdatedUser.bio,
      instagram: rawUpdatedUser.instagram,
      neighborhood: rawUpdatedUser.neighborhood,
      city: rawUpdatedUser.city,
      pfpUrl: rawUpdatedUser.pfpUrl,
      role: rawUpdatedUser.role,
      updatedAt: rawUpdatedUser.updatedAt,
      isActive: rawUpdatedUser.isActive,
      location: parsedLocation,
    };

    return { user };
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
        UPDATE "baker_profile"
        SET location = NULL
        WHERE user_id = ${id}
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
            prepTimeMinutes: true,

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

  async registerUserInventory(
    context: RequestContext,
    id: string,
    data: UserDTO.RegisterUserInventoryRequest,
  ) {
    this.checkPermission(context, id);

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { isActive: true },
    });

    this.checkUser(user);

    const ingredientExists = await prisma.ingredient.findUnique({
      where: { id: data.ingredientId },
    });

    if (!ingredientExists) {
      throw new NotFoundError('Ingredient not found', 'RESOURCE_NOT_FOUND');
    }

    const inventoryExists = await prisma.userInventory.findUnique({
      where: {
        userId_ingredientId: {
          userId: id,
          ingredientId: data.ingredientId,
        },
      },
    });

    if (inventoryExists) {
      throw new ConflictError(
        'Inventory item already exists for this ingredient',
        'RESOURCE_ALREADY_EXISTS',
      );
    }

    const userInventory = await prisma.userInventory.create({
      data: {
        userId: id,
        ingredientId: data.ingredientId,
        currentQuantity: data.currentQuantity ?? 0,
        costPerBaseUnit: data.costPerBaseUnit ?? 0,
      },
      select: {
        userId: true,
        ingredientId: true,
        currentQuantity: true,
        costPerBaseUnit: true,
        lastUpdated: true,
        ingredient: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            baseDimension: true,
            baseUnit: true,
            description: true,
          },
        },
      },
    });

    return { userInventory };
  }

  async selectUserInventory(context: RequestContext, id: string) {
    this.checkPermission(context, id);

    const userInventories = await prisma.userInventory.findMany({
      where: { userId: id },
      take: 10,
      select: {
        ingredientId: true,
        currentQuantity: true,
        costPerBaseUnit: true,
        lastUpdated: true,
        ingredient: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            baseDimension: true,
            baseUnit: true,
            description: true,
          },
        },
      },
    });

    return { userInventories };
  }

  async saveRecipe(context: RequestContext, id: string, data: UserDTO.SaveRecipeRequest) {
    this.checkPermission(context, id);

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { isActive: true },
    });

    this.checkUser(user);

    const recipe = await prisma.recipe.findUnique({
      where: { id: data.recipeId },
      select: { id: true, status: true, userId: true },
    });

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    if (recipe.status !== 'PUBLISHED' && recipe.userId !== id && context.userRole !== 'ADMIN') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    const alreadySaved = await prisma.userSavedRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: id,
          recipeId: data.recipeId,
        },
      },
    });

    if (alreadySaved) {
      throw new ConflictError('Recipe already saved', 'RESOURCE_ALREADY_EXISTS');
    }

    const userSavedRecipe = await prisma.$transaction(async (tx) => {
      const saved = await tx.userSavedRecipe.create({
        data: {
          userId: id,
          recipeId: data.recipeId,
        },
        select: {
          userId: true,
          recipeId: true,
          savedAt: true,
        },
      });

      await tx.recipe.update({
        where: { id: data.recipeId },
        data: {
          totalSaves: {
            increment: 1,
          },
        },
      });

      return saved;
    });

    return { userSavedRecipe };
  }

  async removeSaveRecipe(
    context: RequestContext,
    id: string,
    data: UserDTO.RemoveSaveRecipeRequest,
  ) {
    this.checkPermission(context, id);

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { isActive: true },
    });

    this.checkUser(user);

    const saved = await prisma.userSavedRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId: id,
          recipeId: data.recipeId,
        },
      },
    });

    if (!saved) {
      throw new NotFoundError('Saved recipe not found', 'RESOURCE_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      await tx.userSavedRecipe.delete({
        where: {
          userId_recipeId: {
            userId: id,
            recipeId: data.recipeId,
          },
        },
      });

      await tx.recipe.update({
        where: { id: data.recipeId },
        data: {
          totalSaves: {
            decrement: 1,
          },
        },
      });
    });
  }
}
