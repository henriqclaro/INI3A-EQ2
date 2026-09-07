import type { JsonNullClass } from '@prisma/client/runtime/client';

import prisma from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import {
  ConflictError,
  DefaultAppError,
  ForbiddenError,
  NotFoundError,
} from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { RecipeDTO } from '../types/dtos/recipe.dto';

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
}
