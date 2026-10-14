import type { JsonNullClass } from '@prisma/client/runtime/client';

import prisma from '../config/database';
import { Prisma } from '../generated/prisma/client';
import {
  ConflictError,
  DefaultAppError,
  ForbiddenError,
  NotFoundError,
} from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { RecipeDTO } from '../types/dtos/recipe.dto';
import { deleteRecipeCover, saveRecipeCover } from '../utils/storage.util';

export class RecipeService {
  private checkPermission(context: RequestContext, id: string | null) {
    if (context.userRole === 'ADMIN') {
      return;
    }
    if (!id || context.userId !== id) {
      throw new ForbiddenError('Action denied for lack of privileges');
    }
  }

  async register(context: RequestContext, data: RecipeDTO.RegisterRequest) {
    const targetUserId = data.userId ?? context.userId;
    this.checkPermission(context, targetUserId);

    if (data.parentId) {
      const parentExists = await prisma.recipe.findUnique({
        where: { id: data.parentId },
      });
      if (!parentExists || parentExists.status === 'SUSPENDED') {
        throw new NotFoundError('Parent recipe not found', 'RESOURCE_NOT_FOUND');
      }
    }

    for (const item of data.items) {
      if (item.ingredientId) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: item.ingredientId },
        });
        if (!ingredient) {
          throw new NotFoundError(
            `Ingredient with ID ${item.ingredientId} not found`,
            'RESOURCE_NOT_FOUND',
          );
        }
      }

      if (item.subRecipeId) {
        if (data.parentId && item.subRecipeId === data.parentId) {
          throw new DefaultAppError(
            'Sub-recipe cannot reference parent recipe',
            'SUB_RECIPE_CIRCULAR_DEPENDENCY',
          );
        }

        const subRecipe = await prisma.recipe.findUnique({
          where: { id: item.subRecipeId },
        });

        if (!subRecipe || subRecipe.status === 'SUSPENDED') {
          throw new NotFoundError(
            `Sub-recipe with ID ${item.subRecipeId} not found`,
            'RESOURCE_NOT_FOUND',
          );
        }

        if (
          subRecipe.status !== 'PUBLISHED' &&
          subRecipe.userId !== targetUserId &&
          context.userRole !== 'ADMIN'
        ) {
          throw new ForbiddenError('Action denied for lack of privileges');
        }
      }
    }

    let uniqueTagIds: number[] = [];
    if (data.tagIds && data.tagIds.length > 0) {
      uniqueTagIds = Array.from(new Set(data.tagIds));
      const existingTags = await prisma.tag.findMany({
        where: { id: { in: uniqueTagIds } },
        select: { id: true },
      });
      if (existingTags.length !== uniqueTagIds.length) {
        throw new NotFoundError('One or more tags not found', 'RESOURCE_NOT_FOUND');
      }
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId: targetUserId,
        parentId: data.parentId,
        title: data.title,
        coverUrl: data.coverUrl,
        instructions: data.instructions as unknown as JsonNullClass,
        baseYield: data.baseYield,
        yieldUnit: data.yieldUnit,
        profitMargin: data.profitMargin,
        overhead: data.overhead,
        prepTimeMinutes: data.prepTimeMinutes,
        hourlyLabor: data.hourlyLabor,
        packagingCost: data.packagingCost,

        items: {
          create: data.items.map((item, index) => ({
            ingredientId: item.ingredientId ?? null,
            subRecipeId: item.subRecipeId ?? null,
            quantity: item.quantity,
            unit: item.unit,
            displayQuantity: item.displayQuantity ?? null,
            displayUnit: item.displayUnit ?? null,
            sortOrder: item.sortOrder ?? index,
            notes: item.notes ?? null,
          })),
        },
        tags:
          uniqueTagIds.length > 0
            ? {
                create: uniqueTagIds.map((tagId) => ({
                  tagId,
                })),
              }
            : undefined,
      },
      select: {
        id: true,
        userId: true,
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        title: true,
        coverUrl: true,
        instructions: true,
        baseYield: true,
        yieldUnit: true,
        profitMargin: true,
        overhead: true,
        prepTimeMinutes: true,
        hourlyLabor: true,
        packagingCost: true,
        createdAt: true,

        items: {
          select: {
            id: true,
            ingredientId: true,
            subRecipeId: true,
            quantity: true,
            unit: true,
            displayQuantity: true,
            displayUnit: true,
            sortOrder: true,
            notes: true,
          },
        },
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

    return { recipe };
  }

  async selectSingle(context: RequestContext, id: string) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: id },
      omit: {
        parentId: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                baseDimension: true,
                baseUnit: true,
              },
            },
            subRecipe: {
              select: {
                id: true,
                title: true,
                baseYield: true,
                yieldUnit: true,
              },
            },
          },
        },
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

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    if (context.userId !== recipe.userId && recipe.status !== 'PUBLISHED') {
      // Privacidade para os usuários
      if (context.userRole === 'ADMIN') {
        throw new ForbiddenError('Action denied for lack of privileges');
      } else {
        throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
      }
    }

    const [userReview, reviewGroups] = await Promise.all([
      prisma.recipeReview.findUnique({
        where: {
          userId_recipeId: {
            userId: context.userId,
            recipeId: id,
          },
        },
        select: {
          id: true,
          userId: true,
          recipeId: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.recipeReview.groupBy({
        by: ['rating'],
        where: { recipeId: id },
        _count: { rating: true },
      }),
    ]);

    const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const group of reviewGroups) {
      if (group.rating >= 1 && group.rating <= 5) {
        ratingCounts[group.rating as 1 | 2 | 3 | 4 | 5] = group._count.rating;
      }
    }

    return {
      recipe: {
        ...recipe,
        userReview,
        ratingCounts,
      },
    };
  }

  async selectSingleUserInventory(context: RequestContext, id: string, userId: string) {
    this.checkPermission(context, userId);

    const recipe = await prisma.recipe.findUnique({
      where: { id: id },
      omit: {
        parentId: true,
      },
      include: {
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                baseDimension: true,
                baseUnit: true,
                description: true,
                inventories: {
                  where: {
                    userId: userId,
                  },
                  select: {
                    currentQuantity: true,
                    costPerBaseUnit: true,
                    lastUpdated: true,
                  },
                },
              },
            },
            subRecipe: {
              select: {
                id: true,
                title: true,
                baseYield: true,
                yieldUnit: true,
              },
            },
          },
        },
      },
    });

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    if (context.userId !== recipe.userId && recipe.status !== 'PUBLISHED') {
      // Privacidade para os usuários
      if (context.userRole === 'ADMIN') {
        throw new ForbiddenError('Action denied for lack of privileges');
      } else {
        throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
      }
    }

    const formattedItems = recipe.items.map((item) => {
      const inventory = item.ingredient?.inventories[0] ?? null;

      return {
        id: item.id,
        ingredientId: item.ingredientId,
        subRecipeId: item.subRecipeId,
        quantity: item.quantity,
        unit: item.unit,
        displayQuantity: item.displayQuantity,
        displayUnit: item.displayUnit,
        sortOrder: item.sortOrder,
        notes: item.notes,
        ingredient: item.ingredient
          ? {
              id: item.ingredient.id,
              name: item.ingredient.name,
              slug: item.ingredient.slug,
              category: item.ingredient.category,
              baseDimension: item.ingredient.baseDimension,
              baseUnit: item.ingredient.baseUnit,
              description: item.ingredient.description,
            }
          : null,
        subRecipe: item.subRecipe
          ? {
              id: item.subRecipe.id,
              title: item.subRecipe.title,
              baseYield: item.subRecipe.baseYield,
              yieldUnit: item.subRecipe.yieldUnit,
            }
          : null,
        inventory: inventory
          ? {
              currentQuantity: inventory.currentQuantity,
              costPerBaseUnit: inventory.costPerBaseUnit,
              lastUpdated: inventory.lastUpdated,
            }
          : null,
      };
    });

    const { items: _items, ...recipeData } = recipe;

    return {
      recipe: {
        ...recipeData,
        items: formattedItems,
      },
    };
  }

  async search(query?: RecipeDTO.QueryRequest | string, pageParam?: number) {
    const normalizedQuery: RecipeDTO.QueryRequest =
      typeof query === 'string' ? { search: query, page: pageParam ?? 0 } : (query ?? { page: 0 });

    const search = normalizedQuery.search;
    const page = normalizedQuery.page;
    const dateLimit =
      normalizedQuery.date_limit ??
      normalizedQuery.dateLimit ??
      normalizedQuery.limit_days ??
      normalizedQuery.days;
    const rawSort = normalizedQuery.sort ?? normalizedQuery.orderBy ?? normalizedQuery.order;

    const baseFilter: Prisma.RecipeWhereInput = {
      status: 'PUBLISHED',
    };

    if (search) {
      baseFilter.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            some: {
              tag: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ];
    }

    if (dateLimit !== undefined && dateLimit > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dateLimit);
      baseFilter.createdAt = {
        gte: cutoffDate,
      };
    }

    const safePage = Number(page);
    const skipValue = !isNaN(safePage) && safePage > 0 ? safePage * 10 : 0;

    const orderBy: Prisma.RecipeOrderByWithRelationInput[] = [];

    if (rawSort) {
      const rawList = Array.isArray(rawSort) ? rawSort : [rawSort];
      const tokens = rawList
        .flatMap((item) => item.split(','))
        .map((item) => item.trim())
        .filter(Boolean);

      const seenFields = new Set<string>();

      for (const token of tokens) {
        const parts = token.split(':');
        const rawField = parts[0];
        const rawDir = parts[1];

        if (!rawField) continue;

        const field = rawField.trim().toLowerCase();
        const direction: 'asc' | 'desc' = rawDir?.trim().toLowerCase() === 'asc' ? 'asc' : 'desc';

        if (
          ['rating', 'ratings', 'average_rating', 'stars', 'highest_rating'].includes(field) &&
          !seenFields.has('averageRating')
        ) {
          orderBy.push({ averageRating: direction });
          seenFields.add('averageRating');
        } else if (
          ['reviews', 'review', 'most_reviews', 'ratings_count'].includes(field) &&
          !seenFields.has('totalReviews')
        ) {
          orderBy.push({ totalReviews: direction });
          seenFields.add('totalReviews');
        } else if (
          ['saves', 'saved', 'favorites', 'most_saves'].includes(field) &&
          !seenFields.has('totalSaves')
        ) {
          orderBy.push({ totalSaves: direction });
          seenFields.add('totalSaves');
        } else if (
          ['newest', 'recent', 'created_at', 'createdat', 'date'].includes(field) &&
          !seenFields.has('createdAt')
        ) {
          orderBy.push({ createdAt: direction });
          seenFields.add('createdAt');
        }
      }
    }

    if (!orderBy.some((order) => 'createdAt' in order)) {
      orderBy.push({ createdAt: 'desc' });
    }

    const recipes = await prisma.recipe.findMany({
      where: baseFilter,
      take: 10,
      skip: skipValue,
      orderBy,
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

        profitMargin: true,
        overhead: true,
        hourlyLabor: true,
        packagingCost: true,
        prepTimeMinutes: true,

        totalSaves: true,
        totalReviews: true,
        averageRating: true,

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

  async updateVisibility(
    context: RequestContext,
    id: string,
    data: RecipeDTO.UpdateVisibilityRequest,
  ) {
    this.checkPermission(context, data.userId);

    const [recipe, user] = await Promise.all([
      prisma.recipe.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          title: true,
          status: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          phone: true,
        },
      }),
    ]);

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    if (recipe.userId !== data.userId) {
      throw new ForbiddenError('Action denied for lack of privileges');
    }

    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (data.status === 'PUBLISHED' && !user.phone) {
      throw new ForbiddenError(
        'User phone number is required to make recipe public',
        'USER_PHONE_NUMBER_REQUIRED',
      );
    }

    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: {
        status: data.status,
      },

      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    return { recipe: updatedRecipe };
  }

  async update(
    context: RequestContext,
    id: string,
    data: RecipeDTO.UpdateRequest,
  ): Promise<RecipeDTO.UpdateResponse> {
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe || existingRecipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    this.checkPermission(context, existingRecipe.userId);

    if (data.items) {
      for (const item of data.items) {
        if (item.ingredientId) {
          const ingredient = await prisma.ingredient.findUnique({
            where: { id: item.ingredientId },
          });
          if (!ingredient) {
            throw new NotFoundError(
              `Ingredient with ID ${item.ingredientId} not found`,
              'RESOURCE_NOT_FOUND',
            );
          }
        }

        if (item.subRecipeId) {
          if (
            item.subRecipeId === id ||
            (existingRecipe.parentId && item.subRecipeId === existingRecipe.parentId)
          ) {
            throw new DefaultAppError(
              'Sub-recipe cannot reference self or parent recipe',
              'SUB_RECIPE_CIRCULAR_DEPENDENCY',
            );
          }

          const subRecipe = await prisma.recipe.findUnique({
            where: { id: item.subRecipeId },
          });

          if (!subRecipe || subRecipe.status === 'SUSPENDED') {
            throw new NotFoundError(
              `Sub-recipe with ID ${item.subRecipeId} not found`,
              'RESOURCE_NOT_FOUND',
            );
          }

          if (
            subRecipe.status !== 'PUBLISHED' &&
            subRecipe.userId !== existingRecipe.userId &&
            context.userRole !== 'ADMIN'
          ) {
            throw new ForbiddenError('Action denied for lack of privileges');
          }
        }
      }
    }

    let uniqueTagIds: number[] | undefined;
    if (data.tagIds !== undefined) {
      uniqueTagIds = Array.from(new Set(data.tagIds));
      if (uniqueTagIds.length > 0) {
        const existingTags = await prisma.tag.findMany({
          where: { id: { in: uniqueTagIds } },
          select: { id: true },
        });
        if (existingTags.length !== uniqueTagIds.length) {
          throw new NotFoundError('One or more tags not found', 'RESOURCE_NOT_FOUND');
        }
      }
    }

    const updatedRecipe = await prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.recipeItem.deleteMany({
          where: { recipeId: id },
        });

        await tx.recipeItem.createMany({
          data: data.items.map((item, index) => ({
            recipeId: id,
            ingredientId: item.ingredientId ?? null,
            subRecipeId: item.subRecipeId ?? null,
            quantity: item.quantity,
            unit: item.unit,
            displayQuantity: item.displayQuantity ?? null,
            displayUnit: item.displayUnit ?? null,
            sortOrder: item.sortOrder ?? index,
            notes: item.notes ?? null,
          })),
        });
      }

      if (uniqueTagIds !== undefined) {
        await tx.recipeTag.deleteMany({
          where: { recipeId: id },
        });

        if (uniqueTagIds.length > 0) {
          await tx.recipeTag.createMany({
            data: uniqueTagIds.map((tagId) => ({
              recipeId: id,
              tagId,
            })),
          });
        }
      }

      const updateData: Prisma.RecipeUpdateInput = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
      if (data.instructions !== undefined)
        updateData.instructions = data.instructions as unknown as JsonNullClass;
      if (data.baseYield !== undefined) updateData.baseYield = data.baseYield;
      if (data.yieldUnit !== undefined) updateData.yieldUnit = data.yieldUnit;
      if (data.profitMargin !== undefined) updateData.profitMargin = data.profitMargin;
      if (data.overhead !== undefined) updateData.overhead = data.overhead;
      if (data.prepTimeMinutes !== undefined) updateData.prepTimeMinutes = data.prepTimeMinutes;
      if (data.hourlyLabor !== undefined) updateData.hourlyLabor = data.hourlyLabor;
      if (data.packagingCost !== undefined) updateData.packagingCost = data.packagingCost;

      return tx.recipe.update({
        where: { id },
        data: updateData,
        omit: {
          parentId: true,
        },
        include: {
          parent: {
            select: {
              id: true,
              title: true,
            },
          },
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  category: true,
                  baseDimension: true,
                  baseUnit: true,
                },
              },
              subRecipe: {
                select: {
                  id: true,
                  title: true,
                  baseYield: true,
                  yieldUnit: true,
                },
              },
            },
          },
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
    });

    return { recipe: updatedRecipe };
  }

  async delete(context: RequestContext, id: string): Promise<void> {
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    this.checkPermission(context, recipe.userId);

    const [usedAsSubRecipe, usedInProduction] = await Promise.all([
      prisma.recipeItem.findFirst({
        where: { subRecipeId: id },
        select: { id: true },
      }),
      prisma.production.findFirst({
        where: { recipeId: id },
        select: { id: true },
      }),
    ]);

    if (usedAsSubRecipe) {
      throw new ConflictError(
        'Cannot delete recipe because it is used as a sub-recipe in another recipe',
        'RESOURCE_STATE_CONFLICT',
      );
    }

    if (usedInProduction) {
      throw new ConflictError(
        'Cannot delete recipe because it has associated productions',
        'RESOURCE_STATE_CONFLICT',
      );
    }

    await prisma.recipe.delete({
      where: { id },
    });
  }

  private validateRating(rating: number): void {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new DefaultAppError('Rating must be an integer between 1 and 5', 'INVALID_FORMAT');
    }
  }

  private async recalculateRecipeRating(
    tx: Prisma.TransactionClient,
    recipeId: string,
  ): Promise<{ totalReviews: number; averageRating: Prisma.Decimal }> {
    const aggregate = await tx.recipeReview.aggregate({
      where: { recipeId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const totalReviews = aggregate._count.rating;
    const averageRating =
      aggregate._avg.rating !== null
        ? new Prisma.Decimal(aggregate._avg.rating).toDecimalPlaces(2)
        : new Prisma.Decimal(0);

    await tx.recipe.update({
      where: { id: recipeId },
      data: {
        totalReviews,
        averageRating,
      },
    });

    return { totalReviews, averageRating };
  }

  async createReview(
    context: RequestContext,
    recipeId: string,
    data: RecipeDTO.CreateReviewRequest,
  ): Promise<RecipeDTO.CreateReviewResponse> {
    this.validateRating(data.rating);

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, status: true, userId: true },
    });

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    if (recipe.status !== 'PUBLISHED') {
      throw new ForbiddenError('Only published recipes can be reviewed');
    }

    if (recipe.userId === context.userId) {
      throw new ForbiddenError('Recipe creator cannot review their own recipe');
    }

    const existingReview = await prisma.recipeReview.findUnique({
      where: {
        userId_recipeId: {
          userId: context.userId,
          recipeId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictError('Recipe already reviewed by user', 'RESOURCE_ALREADY_EXISTS');
    }

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.recipeReview.create({
        data: {
          userId: context.userId,
          recipeId,
          rating: data.rating,
        },
        select: {
          id: true,
          userId: true,
          recipeId: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.recalculateRecipeRating(tx, recipeId);

      return createdReview;
    });

    return { review };
  }

  async updateReview(
    context: RequestContext,
    recipeId: string,
    data: RecipeDTO.UpdateReviewRequest,
  ): Promise<RecipeDTO.UpdateReviewResponse> {
    this.validateRating(data.rating);

    const existingReview = await prisma.recipeReview.findUnique({
      where: {
        userId_recipeId: {
          userId: context.userId,
          recipeId,
        },
      },
    });

    if (!existingReview) {
      throw new NotFoundError('Review not found', 'RESOURCE_NOT_FOUND');
    }

    const review = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.recipeReview.update({
        where: {
          userId_recipeId: {
            userId: context.userId,
            recipeId,
          },
        },
        data: {
          rating: data.rating,
        },
        select: {
          id: true,
          userId: true,
          recipeId: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.recalculateRecipeRating(tx, recipeId);

      return updatedReview;
    });

    return { review };
  }

  async deleteReview(context: RequestContext, recipeId: string): Promise<void> {
    const existingReview = await prisma.recipeReview.findUnique({
      where: {
        userId_recipeId: {
          userId: context.userId,
          recipeId,
        },
      },
    });

    if (!existingReview) {
      throw new NotFoundError('Review not found', 'RESOURCE_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipeReview.delete({
        where: {
          userId_recipeId: {
            userId: context.userId,
            recipeId,
          },
        },
      });

      await this.recalculateRecipeRating(tx, recipeId);
    });
  }

  async selectRecipeReviews(
    context: RequestContext,
    recipeId: string,
  ): Promise<RecipeDTO.SelectRecipeReviewsResponse> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, status: true, userId: true, totalReviews: true, averageRating: true },
    });

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    if (
      recipe.status !== 'PUBLISHED' &&
      recipe.userId !== context.userId &&
      context.userRole !== 'ADMIN'
    ) {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    const [reviews, reviewGroups] = await Promise.all([
      prisma.recipeReview.findMany({
        where: { recipeId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          recipeId: true,
          rating: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              pfpUrl: true,
              updatedAt: true,
            },
          },
        },
      }),
      prisma.recipeReview.groupBy({
        by: ['rating'],
        where: { recipeId },
        _count: { rating: true },
      }),
    ]);

    const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const group of reviewGroups) {
      if (group.rating >= 1 && group.rating <= 5) {
        ratingCounts[group.rating as 1 | 2 | 3 | 4 | 5] = group._count.rating;
      }
    }

    return {
      reviews,
      totalReviews: recipe.totalReviews,
      averageRating: recipe.averageRating,
      ratingCounts,
    };
  }

  // Métodos de Storage / Capa ------------------------

  async uploadCover(
    context: RequestContext,
    recipeId: string,
    file: Express.Multer.File,
  ): Promise<RecipeDTO.CoverUploadResponse> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, userId: true, status: true },
    });

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    this.checkPermission(context, recipe.userId);

    const url = await saveRecipeCover(recipeId, file.buffer);

    await prisma.recipe.update({
      where: { id: recipeId },
      data: { coverUrl: url },
    });

    return { url };
  }

  async deleteCover(context: RequestContext, recipeId: string): Promise<void> {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, userId: true, status: true },
    });

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError('Recipe not found', 'RESOURCE_NOT_FOUND');
    }

    this.checkPermission(context, recipe.userId);

    await deleteRecipeCover(recipeId);

    await prisma.recipe.update({
      where: { id: recipeId },
      data: { coverUrl: null },
    });
  }
}
