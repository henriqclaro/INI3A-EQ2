import bcrypt from 'bcrypt';

import prisma from '../config/database';
import { env } from '../config/env.config';
import { Prisma } from '../generated/prisma/client';
import type { UserModel } from '../generated/prisma/models';
import { ConflictError, ForbiddenError, GoneError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { UserDTO } from '../types/dtos/user.dto';
import {
  deleteRecipeCoverSafely,
  deleteUserAvatar,
  deleteUserAvatarSafely,
  saveUserAvatar,
} from '../utils/storage.util';

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

  async search(
    context: RequestContext,
    query?: UserDTO.QueryRequest,
  ): Promise<UserDTO.SearchResponse> {
    if (context.userRole !== 'ADMIN' && context.userRole !== 'MODERATOR') {
      throw new ForbiddenError('Action denied for lack of privileges');
    }

    const emailFilter = query?.email?.trim() || query?.search?.trim();
    const page = query?.page ?? 0;
    const skip = page > 0 ? page * 15 : 0;

    const where: Prisma.UserWhereInput = {
      isActive: true,
    };

    if (emailFilter) {
      where.email = {
        contains: emailFilter,
        mode: 'insensitive',
      };
    }

    const users = await prisma.user.findMany({
      where,
      take: 15,
      skip,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        role: true,
        pfpUrl: true,
        profile: {
          select: {
            publicName: true,
          },
        },
        recipes: {
          where: {
            status: 'PUBLISHED',
          },
          select: {
            id: true,
          },
        },
      },
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        pfpUrl: u.pfpUrl,
        publicName: u.profile?.publicName ?? null,
        recipes: u.recipes.map((r) => r.id),
      })),
    };
  }

  async select(context: RequestContext, id: string) {
    this.checkPermission(context, id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        pfpUrl: true,
        role: true,
        updatedAt: true,
        isActive: true,
      },
    });

    this.checkUser(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        pfpUrl: user.pfpUrl,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    };
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

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    this.checkUser(existingUser);

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        pfpUrl: true,
        role: true,
        updatedAt: true,
      },
    });

    return { user: updatedUser };
  }

  async delete(context: RequestContext, id: string, data: UserDTO.DeleteRequest) {
    const isSuspended = data.state === 'SUSPENDED';

    if (isSuspended) {
      // SUSPENDED is an administrative ban action reserved for moderators and administrators
      if (context.userRole !== 'ADMIN' && context.userRole !== 'MODERATOR') {
        throw new ForbiddenError(
          'Only moderators and administrators can suspend a user',
          'AUTH_INSUFFICIENT_PERMISSIONS',
        );
      }
    } else {
      // DELETED is voluntary account deletion (owner) or administrative removal (admin)
      this.checkPermission(context, id);
    }

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: {
        isActive: true,
        role: true,
      },
    });

    this.checkUser(user);

    if (isSuspended && context.userRole === 'MODERATOR') {
      if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
        throw new ForbiddenError(
          'Moderators cannot suspend other staff members',
          'AUTH_INSUFFICIENT_PERMISSIONS',
        );
      }
    }

    const stateString = data.state.toLocaleLowerCase();

    // Clean up physical avatar image on disk safely
    await deleteUserAvatarSafely(id);

    await prisma.$transaction(async (tx) => {
      // 1. Revoke active auth tokens & password reset requests
      await tx.refreshToken.deleteMany({
        where: { userId: id },
      });

      await tx.passwordReset.deleteMany({
        where: { userId: id },
      });

      // 2. Fetch all user recipes
      const userRecipes = await tx.recipe.findMany({
        where: { userId: id },
        select: {
          id: true,
          coverUrl: true,
          status: true,
        },
      });

      if (isSuspended) {
        // SUSPENDED (Ban): Mark all active user recipes as SUSPENDED and remove from showcases
        await tx.recipe.updateMany({
          where: {
            userId: id,
            status: { not: 'SUSPENDED' },
          },
          data: {
            status: 'SUSPENDED',
          },
        });

        await tx.showcaseRecipe.deleteMany({
          where: { userId: id },
        });
      } else {
        // DELETED: Identify recipes that can be hard-deleted vs recipes that must be archived
        for (const recipe of userRecipes) {
          const [usedAsSubRecipe, usedInProduction] = await Promise.all([
            tx.recipeItem.findFirst({
              where: {
                subRecipeId: recipe.id,
                recipe: { userId: { not: id } },
              },
              select: { id: true },
            }),
            tx.production.findFirst({
              where: { recipeId: recipe.id },
              select: { id: true },
            }),
          ]);

          if (usedAsSubRecipe || usedInProduction) {
            // Cannot hard delete due to Restrict foreign keys: Archive and remove from showcases
            await tx.recipe.update({
              where: { id: recipe.id },
              data: {
                status: 'ARCHIVED',
                coverUrl: null,
              },
            });

            await tx.showcaseRecipe.deleteMany({
              where: { recipeId: recipe.id },
            });

            if (recipe.coverUrl) {
              await deleteRecipeCoverSafely(recipe.id);
            }
          } else {
            // Can safely hard-delete: DB cascades items, tags, saves, reviews, showcases
            await tx.recipe.delete({
              where: { id: recipe.id },
            });

            if (recipe.coverUrl) {
              await deleteRecipeCoverSafely(recipe.id);
            }
          }
        }
      }

      // 3. Clean up recipes saved by this user and decrement totalSaves counters (both DELETED and SUSPENDED ban)
      const userSaves = await tx.userSavedRecipe.findMany({
        where: { userId: id },
        select: { recipeId: true },
      });

      for (const save of userSaves) {
        await tx.recipe
          .update({
            where: { id: save.recipeId },
            data: {
              totalSaves: { decrement: 1 },
            },
          })
          .catch(() => {});
      }

      await tx.userSavedRecipe.deleteMany({
        where: { userId: id },
      });

      // 4. Clean up reviews written by this user on other recipes & recalculate ratings (both DELETED and SUSPENDED ban)
      const userReviews = await tx.recipeReview.findMany({
        where: { userId: id },
        select: { recipeId: true },
      });

      await tx.recipeReview.deleteMany({
        where: { userId: id },
      });

      for (const r of userReviews) {
        const aggregate = await tx.recipeReview.aggregate({
          where: { recipeId: r.recipeId },
          _avg: { rating: true },
          _count: { rating: true },
        });

        const totalReviews = aggregate._count.rating;
        const averageRating =
          aggregate._avg.rating !== null
            ? new Prisma.Decimal(aggregate._avg.rating).toDecimalPlaces(2)
            : new Prisma.Decimal(0);

        await tx.recipe
          .update({
            where: { id: r.recipeId },
            data: {
              totalReviews,
              averageRating,
            },
          })
          .catch(() => {});
      }

      if (!isSuspended) {
        // 5. Delete BakerProfile on DELETED (cascades UserTag and ShowcaseRecipe)
        await tx.bakerProfile.deleteMany({
          where: { userId: id },
        });

        // 6. Clean up user inventory on DELETED
        await tx.userInventory.deleteMany({
          where: { userId: id },
        });

        // 7. Clean up unused custom ingredients created by this user on DELETED
        const customIngredients = await tx.ingredient.findMany({
          where: { creatorId: id },
          select: { id: true },
        });

        for (const ing of customIngredients) {
          const [inRecipe, inInv, inTx] = await Promise.all([
            tx.recipeItem.findFirst({ where: { ingredientId: ing.id } }),
            tx.userInventory.findFirst({ where: { ingredientId: ing.id } }),
            tx.inventoryTransaction.findFirst({ where: { ingredientId: ing.id } }),
          ]);

          if (!inRecipe && !inInv && !inTx) {
            await tx.ingredientConversion.deleteMany({ where: { ingredientId: ing.id } });
            await tx.ingredient.delete({ where: { id: ing.id } });
          }
        }

        // 8. Detach user from created tags on DELETED
        await tx.tag.updateMany({
          where: { creatorId: id },
          data: { creatorId: null },
        });
      }

      // 9. Mark user inactive.
      // NOTE: On SUSPENDED (Ban), email and phone are RETAINED to block re-registration via unique constraints.
      // On DELETED (Voluntary removal), email and phone are anonymized.
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
    });
  }

  // Queries de Relações ------------------------

  async selectUserRecipe(
    context: RequestContext,
    id: string,
    query?: UserDTO.RecipeQueryRequest,
  ): Promise<UserDTO.SelectUserRecipesResponse> {
    this.checkPermission(context, id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    this.checkUser(user);

    const page = query?.page ?? 0;
    const skip = page > 0 ? page * 10 : 0;

    const where: Prisma.RecipeWhereInput = {
      userId: id,
      status: query?.status ? query.status : { not: 'SUSPENDED' },
    };

    const recipes = await prisma.recipe.findMany({
      where,
      skip,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        title: true,
        coverUrl: true,
        status: true,
        baseYield: true,
        yieldUnit: true,

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

    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    this.checkUser(user);

    const userSaves = await prisma.userSavedRecipe.findMany({
      where: { userId: id },
      orderBy: { savedAt: 'desc' },
      select: {
        savedAt: true,

        recipe: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            baseYield: true,
            yieldUnit: true,

            profitMargin: true,
            overhead: true,
            hourlyLabor: true,
            packagingCost: true,
            prepTimeMinutes: true,
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
        },
      },
    });

    return { userSaves };
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

  async selectUserReviews(
    context: RequestContext,
    id: string,
  ): Promise<UserDTO.SelectUserReviewsResponse> {
    this.checkPermission(context, id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true },
    });

    this.checkUser(user);

    const reviews = await prisma.recipeReview.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        recipeId: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
        recipe: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            averageRating: true,
            totalReviews: true,
            updatedAt: true,
          },
        },
      },
    });

    return { reviews };
  }

  // Métodos de Storage / Avatar ------------------------

  async uploadAvatar(
    context: RequestContext,
    targetUserId: string,
    file: Express.Multer.File,
  ): Promise<UserDTO.AvatarUploadResponse> {
    this.checkPermission(context, targetUserId);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isActive: true },
    });

    this.checkUser(user);

    const url = await saveUserAvatar(targetUserId, file.buffer);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { pfpUrl: url },
    });

    return { url };
  }

  async deleteAvatar(context: RequestContext, targetUserId: string): Promise<void> {
    this.checkPermission(context, targetUserId);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isActive: true },
    });

    this.checkUser(user);

    await deleteUserAvatar(targetUserId);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { pfpUrl: null },
    });
  }
}
