import prisma from '../config/database';
import { Prisma } from '../generated/prisma/client';
import type { RequestContext } from '../types/context.interface';
import type { AnalyticsDTO } from '../types/dtos/analytics.dto';
import { explodeBOM } from '../utils/bom-explosion.util';

export class AnalyticsService {
  async getProfitSummary(
    context: RequestContext,
    query: AnalyticsDTO.ProfitSummaryQuery,
  ): Promise<AnalyticsDTO.ProfitSummaryResponse> {
    const startOfDay = new Date(`${query.startDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${query.endDate}T23:59:59.999Z`);

    const [productions, wasteAggregate] = await Promise.all([
      prisma.production.findMany({
        where: {
          userId: context.userId,
          canceledAt: null,
          productionDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          id: true,
          ingredientCost: true,
          laborCost: true,
          overheadCost: true,
          packagingCost: true,
          totalCost: true,
          recipe: {
            select: {
              profitMargin: true,
            },
          },
        },
      }),
      prisma.inventoryTransaction.aggregate({
        where: {
          userId: context.userId,
          transactionType: 'WASTE',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          totalCost: true,
        },
      }),
    ]);

    let totalIngredientCost = new Prisma.Decimal(0);
    let totalLaborCost = new Prisma.Decimal(0);
    let totalOverheadCost = new Prisma.Decimal(0);
    let totalPackagingCost = new Prisma.Decimal(0);
    let totalProductionCost = new Prisma.Decimal(0);
    let projectedRevenue = new Prisma.Decimal(0);

    for (const production of productions) {
      totalIngredientCost = totalIngredientCost.plus(production.ingredientCost);
      totalLaborCost = totalLaborCost.plus(production.laborCost);
      totalOverheadCost = totalOverheadCost.plus(production.overheadCost);
      totalPackagingCost = totalPackagingCost.plus(production.packagingCost);
      totalProductionCost = totalProductionCost.plus(production.totalCost);

      const profitMargin = production.recipe?.profitMargin ?? new Prisma.Decimal(0);
      const marginPercent = profitMargin.dividedBy(100);

      const marginDivisor = new Prisma.Decimal(1).minus(marginPercent);

      const revenue = marginDivisor.gt(0)
        ? production.totalCost.dividedBy(marginDivisor)
        : production.totalCost;

      projectedRevenue = projectedRevenue.plus(revenue);
    }

    const wasteCost = wasteAggregate._sum.totalCost ?? new Prisma.Decimal(0);
    const netProfit = projectedRevenue
      .minus(totalProductionCost)
      .minus(wasteCost)
      .toDecimalPlaces(2);

    let achievedMarginPercent = new Prisma.Decimal(0);
    if (projectedRevenue.gt(0)) {
      achievedMarginPercent = netProfit.dividedBy(projectedRevenue).times(100).toDecimalPlaces(2);
    }

    return {
      summary: {
        startDate: query.startDate,
        endDate: query.endDate,
        totalProductions: productions.length,
        projectedRevenue: projectedRevenue.toDecimalPlaces(2),
        totalProductionCost: totalProductionCost.toDecimalPlaces(2),
        wasteCost: wasteCost.toDecimalPlaces(2),
        netProfit,
        achievedMarginPercent,
        costBreakdown: {
          ingredientCost: totalIngredientCost.toDecimalPlaces(2),
          laborCost: totalLaborCost.toDecimalPlaces(2),
          overheadCost: totalOverheadCost.toDecimalPlaces(2),
          packagingCost: totalPackagingCost.toDecimalPlaces(2),
          totalProductionCost: totalProductionCost.toDecimalPlaces(2),
        },
      },
    };
  }

  async projectPurchases(
    context: RequestContext,
    data: AnalyticsDTO.PurchaseProjectionRequest,
  ): Promise<AnalyticsDTO.PurchaseProjectionResponse> {
    const demandsMap = await explodeBOM(data.plannedProductions, prisma, context);

    const ingredientIds = Array.from(demandsMap.keys());
    const inventories = await prisma.userInventory.findMany({
      where: {
        userId: context.userId,
        ingredientId: { in: ingredientIds },
      },
      select: {
        ingredientId: true,
        currentQuantity: true,
        costPerBaseUnit: true,
      },
    });

    const inventoryMap = new Map(inventories.map((inv) => [inv.ingredientId, inv]));
    const deficitItems: AnalyticsDTO.PurchaseProjectionDeficitItem[] = [];
    let totalEstimatedExpenditure = new Prisma.Decimal(0);

    for (const demand of demandsMap.values()) {
      const inv = inventoryMap.get(demand.ingredientId);
      const currentQuantity = inv ? inv.currentQuantity : new Prisma.Decimal(0);
      const costPerBaseUnit = inv ? inv.costPerBaseUnit : new Prisma.Decimal(0);

      const deficit = demand.requiredQuantity.minus(currentQuantity);
      if (deficit.gt(0)) {
        const deficitQuantity = deficit.toDecimalPlaces(3);
        const isUnestimated = costPerBaseUnit.lte(0);
        const estimatedCost = isUnestimated
          ? new Prisma.Decimal(0)
          : deficitQuantity.times(costPerBaseUnit).toDecimalPlaces(2);

        totalEstimatedExpenditure = totalEstimatedExpenditure.plus(estimatedCost);

        deficitItems.push({
          ingredientId: demand.ingredientId,
          name: demand.name,
          unit: demand.unit,
          requiredQuantity: demand.requiredQuantity.toDecimalPlaces(3),
          currentQuantity: currentQuantity.toDecimalPlaces(3),
          deficitQuantity,
          costPerBaseUnit: costPerBaseUnit.toDecimalPlaces(6),
          estimatedCost,
          unestimated: isUnestimated,
        });
      }
    }

    deficitItems.sort((a, b) => {
      const costDiff = b.estimatedCost.minus(a.estimatedCost);
      if (!costDiff.isZero()) {
        return costDiff.isPositive() ? 1 : -1;
      }
      const qtyDiff = b.deficitQuantity.minus(a.deficitQuantity);
      if (!qtyDiff.isZero()) {
        return qtyDiff.isPositive() ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      projection: {
        totalItemsToPurchase: deficitItems.length,
        totalEstimatedExpenditure: totalEstimatedExpenditure.toDecimalPlaces(2),
        items: deficitItems,
      },
    };
  }
}
