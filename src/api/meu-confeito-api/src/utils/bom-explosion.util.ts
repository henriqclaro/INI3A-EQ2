import prisma from '../config/database';
import { Prisma, type StandardUnit } from '../generated/prisma/client';
import { DefaultAppError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import { UNIT_TO_DIMENSION_MAP } from './unit-conversion.util';

export interface PlannedProductionTarget {
  recipeId: string;
  targetYield: number;
}

export interface AggregatedLeafRequirement {
  ingredientId: number;
  name: string;
  requiredQuantity: Prisma.Decimal;
  unit: StandardUnit;
}

export async function explodeBOM(
  targets: PlannedProductionTarget[],
  client: Prisma.TransactionClient | typeof prisma = prisma,
  context?: RequestContext,
): Promise<Map<number, AggregatedLeafRequirement>> {
  const requirementsMap = new Map<number, AggregatedLeafRequirement>();

  async function traverseRecipe(
    recipeId: string,
    scaleFactor: Prisma.Decimal,
    visited: Set<string>,
  ): Promise<void> {
    if (visited.has(recipeId)) {
      throw new DefaultAppError(
        'Circular dependency detected in recipe BOM',
        'SUB_RECIPE_CIRCULAR_DEPENDENCY',
      );
    }

    visited.add(recipeId);

    const recipe = await client.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        userId: true,
        title: true,
        baseYield: true,
        yieldUnit: true,
        status: true,
        items: {
          select: {
            id: true,
            ingredientId: true,
            subRecipeId: true,
            quantity: true,
            unit: true,
            ingredient: {
              select: {
                id: true,
                name: true,
                baseUnit: true,
              },
            },
            subRecipe: {
              select: {
                id: true,
                userId: true,
                title: true,
                baseYield: true,
                yieldUnit: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!recipe || recipe.status === 'SUSPENDED') {
      throw new NotFoundError(`Recipe not found: ${recipeId}`, 'RESOURCE_NOT_FOUND');
    }

    if (
      context &&
      recipe.status !== 'PUBLISHED' &&
      recipe.userId !== context.userId &&
      context.userRole !== 'ADMIN'
    ) {
      const isSaved = await client.userSavedRecipe.findUnique({
        where: {
          userId_recipeId: {
            userId: context.userId,
            recipeId,
          },
        },
      });

      if (!isSaved) {
        throw new NotFoundError(`Recipe not found: ${recipeId}`, 'RESOURCE_NOT_FOUND');
      }
    }

    for (const item of recipe.items) {
      if (item.ingredientId && item.ingredient) {
        const unitMultiplier = UNIT_TO_DIMENSION_MAP[item.unit]?.multiplierToBase ?? 1;
        const itemQtyInBaseUnit = new Prisma.Decimal(item.quantity).times(unitMultiplier);
        const scaledQty = itemQtyInBaseUnit.times(scaleFactor);

        const existing = requirementsMap.get(item.ingredientId);
        if (existing) {
          existing.requiredQuantity = existing.requiredQuantity.plus(scaledQty);
        } else {
          requirementsMap.set(item.ingredientId, {
            ingredientId: item.ingredientId,
            name: item.ingredient.name,
            requiredQuantity: scaledQty,
            unit: item.ingredient.baseUnit,
          });
        }
      } else if (item.subRecipeId && item.subRecipe) {
        if (item.subRecipe.status === 'SUSPENDED') {
          throw new NotFoundError(
            `Sub-recipe ${item.subRecipe.title} is suspended`,
            'RESOURCE_NOT_FOUND',
          );
        }

        if (
          context &&
          item.subRecipe.status !== 'PUBLISHED' &&
          item.subRecipe.userId !== context.userId &&
          context.userRole !== 'ADMIN'
        ) {
          const isSubSaved = await client.userSavedRecipe.findUnique({
            where: {
              userId_recipeId: {
                userId: context.userId,
                recipeId: item.subRecipeId,
              },
            },
          });

          if (!isSubSaved) {
            throw new NotFoundError(
              `Sub-recipe ${item.subRecipe.title} not found`,
              'RESOURCE_NOT_FOUND',
            );
          }
        }

        const itemUnitMultiplier = UNIT_TO_DIMENSION_MAP[item.unit]?.multiplierToBase ?? 1;
        const subYieldMultiplier =
          UNIT_TO_DIMENSION_MAP[item.subRecipe.yieldUnit]?.multiplierToBase ?? 1;

        const itemQtyInBase = new Prisma.Decimal(item.quantity).times(itemUnitMultiplier);
        const subYieldInBase = new Prisma.Decimal(item.subRecipe.baseYield).times(
          subYieldMultiplier,
        );

        if (subYieldInBase.lte(0)) {
          throw new DefaultAppError(
            `Sub-recipe ${item.subRecipe.title} has invalid base yield`,
            'INVALID_FORMAT',
          );
        }

        const subScaleFactor = itemQtyInBase.dividedBy(subYieldInBase).times(scaleFactor);

        await traverseRecipe(item.subRecipeId, subScaleFactor, new Set(visited));
      }
    }
  }

  for (const target of targets) {
    const targetYieldDec = new Prisma.Decimal(target.targetYield);
    if (targetYieldDec.lte(0)) {
      throw new DefaultAppError('Target yield must be greater than zero', 'INVALID_FORMAT');
    }

    const rootRecipe = await client.recipe.findUnique({
      where: { id: target.recipeId },
      select: {
        id: true,
        userId: true,
        title: true,
        baseYield: true,
        yieldUnit: true,
        status: true,
      },
    });

    if (!rootRecipe || rootRecipe.status === 'SUSPENDED') {
      throw new NotFoundError(`Recipe not found: ${target.recipeId}`, 'RESOURCE_NOT_FOUND');
    }

    if (
      context &&
      rootRecipe.status !== 'PUBLISHED' &&
      rootRecipe.userId !== context.userId &&
      context.userRole !== 'ADMIN'
    ) {
      throw new NotFoundError(`Recipe not found: ${target.recipeId}`, 'RESOURCE_NOT_FOUND');
    }

    const baseYieldDec = new Prisma.Decimal(rootRecipe.baseYield);
    if (baseYieldDec.lte(0)) {
      throw new DefaultAppError(
        `Recipe ${rootRecipe.title} has invalid base yield`,
        'INVALID_FORMAT',
      );
    }

    const scaleFactor = targetYieldDec.dividedBy(baseYieldDec);
    await traverseRecipe(target.recipeId, scaleFactor, new Set<string>());
  }

  return requirementsMap;
}
