import prisma from '../config/database';
import { Prisma } from '../generated/prisma/client';
import { DefaultAppError, ForbiddenError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { ProductionDTO } from '../types/dtos/production.dto';
import {
  calculateProductionCosts,
  calculateScaleFactor,
  resolveRecipeBOM,
} from '../utils/production-calculator.util';

export class ProductionService {
  private readonly productionSelect = {
    id: true,
    userId: true,
    recipeId: true,
    yieldProduced: true,
    productionDate: true,
    expirationDate: true,
    canceledAt: true,
    ingredientCost: true,
    laborCost: true,
    overheadCost: true,
    packagingCost: true,
    totalCost: true,
    unitCost: true,
    recipe: {
      select: {
        id: true,
        title: true,
        yieldUnit: true,
        baseYield: true,
      },
    },
    transactions: {
      select: {
        id: true,
        ingredientId: true,
        transactionType: true,
        quantityChanged: true,
        measurementUnit: true,
        unitCost: true,
        totalCost: true,
        expirationDate: true,
        createdAt: true,
        ingredient: {
          select: {
            id: true,
            name: true,
            slug: true,
            baseUnit: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
  } as const;

  async register(
    context: RequestContext,
    data: ProductionDTO.RegisterRequest,
  ): Promise<ProductionDTO.RegisterResponse> {
    return prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.findUnique({
        where: { id: data.recipeId },
        select: {
          id: true,
          userId: true,
          title: true,
          baseYield: true,
          yieldUnit: true,
          status: true,
          prepTimeMinutes: true,
          hourlyLabor: true,
          overhead: true,
          packagingCost: true,
        },
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

      const scaleFactor = calculateScaleFactor(data.yieldProduced, recipe.baseYield);
      const leafRequirements = await resolveRecipeBOM(recipe.id, scaleFactor, tx);

      const ingredientIds = leafRequirements.map((r) => r.ingredientId);
      const inventories = await tx.userInventory.findMany({
        where: {
          userId: context.userId,
          ingredientId: { in: ingredientIds },
        },
      });

      const inventoryMap = new Map(inventories.map((inv) => [inv.ingredientId, inv]));

      for (const req of leafRequirements) {
        const inv = inventoryMap.get(req.ingredientId);
        if (!inv || inv.currentQuantity.lt(req.quantity)) {
          throw new DefaultAppError(
            `Insufficient stock for ingredient ${req.name}`,
            'INSUFFICIENT_STOCK',
          );
        }
      }

      let totalIngredientCost = new Prisma.Decimal(0);
      for (const req of leafRequirements) {
        const inv = inventoryMap.get(req.ingredientId)!;
        const cost = req.quantity.times(inv.costPerBaseUnit);
        totalIngredientCost = totalIngredientCost.plus(cost);
      }

      const costs = calculateProductionCosts({
        yieldProduced: data.yieldProduced,
        baseYield: recipe.baseYield,
        ingredientCost: totalIngredientCost,
        prepTimeMinutes: recipe.prepTimeMinutes,
        hourlyLabor: recipe.hourlyLabor,
        overhead: recipe.overhead,
        packagingCost: recipe.packagingCost,
      });

      const production = await tx.production.create({
        data: {
          userId: context.userId,
          recipeId: recipe.id,
          yieldProduced: new Prisma.Decimal(data.yieldProduced),
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
          ingredientCost: costs.ingredientCost,
          laborCost: costs.laborCost,
          overheadCost: costs.overheadCost,
          packagingCost: costs.packagingCost,
          totalCost: costs.totalCost,
          unitCost: costs.unitCost,
        },
      });

      for (const req of leafRequirements) {
        const inv = inventoryMap.get(req.ingredientId)!;
        const itemTotalCost = req.quantity.times(inv.costPerBaseUnit).toDecimalPlaces(2);

        await tx.userInventory.update({
          where: {
            userId_ingredientId: {
              userId: context.userId,
              ingredientId: req.ingredientId,
            },
          },
          data: {
            currentQuantity: {
              decrement: req.quantity,
            },
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            userId: context.userId,
            ingredientId: req.ingredientId,
            productionId: production.id,
            transactionType: 'PRODUCTION_USAGE',
            quantityChanged: req.quantity.negated(),
            measurementUnit: req.baseUnit,
            unitCost: inv.costPerBaseUnit.toDecimalPlaces(4),
            totalCost: itemTotalCost,
            expirationDate: inv.expirationDate,
          },
        });
      }

      const result = await tx.production.findUnique({
        where: { id: production.id },
        select: this.productionSelect,
      });

      return { production: result! };
    });
  }

  async cancel(
    context: RequestContext,
    productionId: string,
  ): Promise<ProductionDTO.CancelResponse> {
    return prisma.$transaction(async (tx) => {
      const production = await tx.production.findUnique({
        where: { id: productionId },
        include: {
          transactions: true,
        },
      });

      if (!production) {
        throw new NotFoundError('Production not found', 'RESOURCE_NOT_FOUND');
      }

      if (production.userId !== context.userId && context.userRole !== 'ADMIN') {
        throw new ForbiddenError('Action denied for lack of privileges');
      }

      if (production.canceledAt) {
        throw new DefaultAppError('Production run has already been canceled', 'ALREADY_CANCELED');
      }

      await tx.production.update({
        where: { id: productionId },
        data: {
          canceledAt: new Date(),
        },
      });

      const usageTransactions = production.transactions.filter(
        (t) => t.transactionType === 'PRODUCTION_USAGE',
      );

      for (const txItem of usageTransactions) {
        const reversalQuantity = txItem.quantityChanged.abs();

        await tx.userInventory.upsert({
          where: {
            userId_ingredientId: {
              userId: context.userId,
              ingredientId: txItem.ingredientId,
            },
          },
          create: {
            userId: context.userId,
            ingredientId: txItem.ingredientId,
            currentQuantity: reversalQuantity,
            costPerBaseUnit: txItem.unitCost,
            expirationDate: txItem.expirationDate,
          },
          update: {
            currentQuantity: {
              increment: reversalQuantity,
            },
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            userId: context.userId,
            ingredientId: txItem.ingredientId,
            productionId: production.id,
            transactionType: 'PRODUCTION_REVERSAL',
            quantityChanged: reversalQuantity,
            measurementUnit: txItem.measurementUnit,
            unitCost: txItem.unitCost,
            totalCost: txItem.totalCost,
            expirationDate: txItem.expirationDate,
          },
        });
      }

      const updated = await tx.production.findUnique({
        where: { id: productionId },
        select: this.productionSelect,
      });

      return { production: updated! };
    });
  }

  async list(
    context: RequestContext,
    query?: ProductionDTO.QueryRequest,
  ): Promise<ProductionDTO.ListResponse> {
    const page = query?.page ?? 0;
    const limit = query?.limit ?? 10;
    const skip = page > 0 ? page * limit : 0;

    const where: Prisma.ProductionWhereInput = {
      userId: context.userId,
    };

    if (query?.recipeId) {
      where.recipeId = query.recipeId;
    }

    if (!query?.includeCanceled) {
      where.canceledAt = null;
    }

    const productions = await prisma.production.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        productionDate: 'desc',
      },
      select: this.productionSelect,
    });

    return { productions };
  }

  async selectSingle(context: RequestContext, id: string): Promise<ProductionDTO.SelectResponse> {
    const production = await prisma.production.findUnique({
      where: { id },
      select: this.productionSelect,
    });

    if (!production) {
      throw new NotFoundError('Production not found', 'RESOURCE_NOT_FOUND');
    }

    if (production.userId !== context.userId && context.userRole !== 'ADMIN') {
      throw new ForbiddenError('Action denied for lack of privileges');
    }

    return { production };
  }
}
