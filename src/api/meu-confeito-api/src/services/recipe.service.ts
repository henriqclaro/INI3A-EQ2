import type { JsonNullClass } from '@prisma/client/runtime/client';

import prisma from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { DefaultAppError, ForbiddenError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { RecipeDTO } from '../types/dtos/recipe.dto';

export class RecipeService {
  private checkPermission(context: RequestContext, id: string) {
    if (context.userId !== id && context.userRole !== 'ADMIN') {
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
      },
      select: {
        id: true,
        userId: true,
        parentId: true,
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
      },
    });

    return { recipe };
  }

  async selectSingle(context: RequestContext, id: string) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: id },

      include: {
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

    return { recipe };
  }

  async selectSingleUserInventory(context: RequestContext, id: string, userId: string) {
    this.checkPermission(context, userId);

    const recipe = await prisma.recipe.findUnique({
      where: { id: id },

      include: {
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

  async search(search?: string, page?: number) {
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

    const safePage = Number(page);
    const skipValue = !isNaN(safePage) && safePage > 0 ? safePage * 10 : 0;

    const recipes = await prisma.recipe.findMany({
      where: baseFilter,
      take: 10,
      skip: skipValue,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        coverUrl: true,

        profitMargin: true,
        overhead: true,
        hourlyLabor: true,
        packagingCost: true,
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
}
