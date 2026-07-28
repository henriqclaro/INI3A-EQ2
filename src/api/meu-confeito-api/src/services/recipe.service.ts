import type { JsonNullClass } from '@prisma/client/runtime/client';

import prisma from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { ForbiddenError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { RecipeDTO } from '../types/dtos/recipe.dto';

export class RecipeService {
  private checkPermission(context: RequestContext, id: string) {
    if (context.userId !== id && context.userRole !== 'ADMIN') {
      throw new ForbiddenError('Action denied for lack of privileges');
    }
  }

  async register(context: RequestContext, data: RecipeDTO.RegisterRequest) {
    this.checkPermission(context, data.userId);

    const recipe = await prisma.recipe.create({
      data: {
        userId: data.userId,
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

        ingredients: {
          create: data.ingredients.map((ing) => ({
            ingredientId: ing.ingredientId,
            baseQuantity: ing.baseQauntity,
            measurementUnit: ing.measurementUnit,
            notes: ing.notes,
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

        ingredients: {
          select: {
            ingredientId: true,
            baseQuantity: true,
            measurementUnit: true,
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
        ingredients: {
          select: {
            baseQuantity: true,
            measurementUnit: true,
            notes: true,
            ingredientId: true,

            ingredient: {
              select: {
                id: true,
                name: true,
                category: true,
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
}
