import { Prisma, type StandardUnit } from '../generated/prisma/client';
import { DefaultAppError, NotFoundError } from '../responses/http.error';
import { UNIT_TO_DIMENSION_MAP } from './unit-conversion.util';

export type DecimalValue = Prisma.Decimal | number | string;

export interface LeafIngredientRequirement {
  ingredientId: number;
  name: string;
  quantity: Prisma.Decimal;
  baseUnit: StandardUnit;
}

export interface ProductionCostParams {
  yieldProduced: DecimalValue;
  baseYield: DecimalValue;
  ingredientCost: DecimalValue;
  prepTimeMinutes?: number | null;
  hourlyLabor?: DecimalValue | null;
  overhead?: DecimalValue | null;
  packagingCost?: DecimalValue | null;
}

export interface ProductionCostSnapshot {
  scaleFactor: Prisma.Decimal;
  ingredientCost: Prisma.Decimal;
  laborCost: Prisma.Decimal;
  overheadCost: Prisma.Decimal;
  packagingCost: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  unitCost: Prisma.Decimal;
}

export function calculateScaleFactor(
  yieldProduced: DecimalValue,
  baseYield: DecimalValue,
): Prisma.Decimal {
  const yieldProducedDec = new Prisma.Decimal(yieldProduced);
  const baseYieldDec = new Prisma.Decimal(baseYield);

  if (baseYieldDec.lte(0)) {
    throw new DefaultAppError('Base yield must be greater than zero', 'INVALID_FORMAT');
  }

  return yieldProducedDec.dividedBy(baseYieldDec);
}

export function calculateProductionCosts(params: ProductionCostParams): ProductionCostSnapshot {
  const yieldProduced = new Prisma.Decimal(params.yieldProduced);
  const baseYield = new Prisma.Decimal(params.baseYield);
  const scaleFactor = yieldProduced.dividedBy(baseYield);

  const ingredientCost = new Prisma.Decimal(params.ingredientCost).toDecimalPlaces(2);

  const prepTimeMinutes = new Prisma.Decimal(params.prepTimeMinutes ?? 0);
  const hourlyLabor = new Prisma.Decimal(params.hourlyLabor ?? 0);
  const laborCost = prepTimeMinutes
    .dividedBy(60)
    .times(hourlyLabor)
    .times(scaleFactor)
    .toDecimalPlaces(2);

  const basePackagingCost = new Prisma.Decimal(params.packagingCost ?? 0);
  const packagingCost = basePackagingCost.times(scaleFactor).toDecimalPlaces(2);

  const overheadPercent = new Prisma.Decimal(params.overhead ?? 0);
  const overheadCost = ingredientCost
    .plus(laborCost)
    .plus(packagingCost)
    .times(overheadPercent.dividedBy(100))
    .toDecimalPlaces(2);

  const totalCost = ingredientCost
    .plus(laborCost)
    .plus(overheadCost)
    .plus(packagingCost)
    .toDecimalPlaces(2);

  const unitCost = totalCost.dividedBy(yieldProduced).toDecimalPlaces(4);

  return {
    scaleFactor,
    ingredientCost,
    laborCost,
    overheadCost,
    packagingCost,
    totalCost,
    unitCost,
  };
}

export async function resolveRecipeBOM(
  recipeId: string,
  scaleFactor: Prisma.Decimal,
  tx: Prisma.TransactionClient,
  visited: Set<string> = new Set<string>(),
): Promise<LeafIngredientRequirement[]> {
  if (visited.has(recipeId)) {
    throw new DefaultAppError(
      'Circular dependency detected in recipe BOM',
      'SUB_RECIPE_CIRCULAR_DEPENDENCY',
    );
  }

  visited.add(recipeId);

  const recipe = await tx.recipe.findUnique({
    where: { id: recipeId },
    select: {
      id: true,
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
              baseDimension: true,
            },
          },
          subRecipe: {
            select: {
              id: true,
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
    throw new NotFoundError(`Recipe not found or suspended: ${recipeId}`, 'RESOURCE_NOT_FOUND');
  }

  const requirementsMap = new Map<number, LeafIngredientRequirement>();

  for (const item of recipe.items) {
    if (item.ingredientId && item.ingredient) {
      const unitMultiplier = UNIT_TO_DIMENSION_MAP[item.unit]?.multiplierToBase ?? 1;
      const itemQtyInBaseUnit = new Prisma.Decimal(item.quantity).times(unitMultiplier);
      const scaledQty = itemQtyInBaseUnit.times(scaleFactor);

      const existing = requirementsMap.get(item.ingredientId);
      if (existing) {
        existing.quantity = existing.quantity.plus(scaledQty);
      } else {
        requirementsMap.set(item.ingredientId, {
          ingredientId: item.ingredientId,
          name: item.ingredient.name,
          quantity: scaledQty,
          baseUnit: item.ingredient.baseUnit,
        });
      }
    } else if (item.subRecipeId && item.subRecipe) {
      if (item.subRecipe.status === 'SUSPENDED') {
        throw new NotFoundError(
          `Sub-recipe ${item.subRecipe.title} is suspended`,
          'RESOURCE_NOT_FOUND',
        );
      }

      const itemUnitMultiplier = UNIT_TO_DIMENSION_MAP[item.unit]?.multiplierToBase ?? 1;
      const subYieldMultiplier =
        UNIT_TO_DIMENSION_MAP[item.subRecipe.yieldUnit]?.multiplierToBase ?? 1;

      const itemQtyInBase = new Prisma.Decimal(item.quantity).times(itemUnitMultiplier);
      const subYieldInBase = new Prisma.Decimal(item.subRecipe.baseYield).times(subYieldMultiplier);

      if (subYieldInBase.lte(0)) {
        throw new DefaultAppError(
          `Sub-recipe ${item.subRecipe.title} has invalid base yield`,
          'INVALID_FORMAT',
        );
      }

      const subScaleFactor = itemQtyInBase.dividedBy(subYieldInBase).times(scaleFactor);

      const subRequirements = await resolveRecipeBOM(
        item.subRecipeId,
        subScaleFactor,
        tx,
        new Set(visited),
      );

      for (const subReq of subRequirements) {
        const existing = requirementsMap.get(subReq.ingredientId);
        if (existing) {
          existing.quantity = existing.quantity.plus(subReq.quantity);
        } else {
          requirementsMap.set(subReq.ingredientId, {
            ingredientId: subReq.ingredientId,
            name: subReq.name,
            quantity: subReq.quantity,
            baseUnit: subReq.baseUnit,
          });
        }
      }
    }
  }

  return Array.from(requirementsMap.values());
}
