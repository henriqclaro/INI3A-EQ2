import prisma from '../config/database';
import { Prisma } from '../generated/prisma/client';
import { DefaultAppError, NotFoundError } from '../responses/http.error';
import type { RequestContext } from '../types/context.interface';
import type { InventoryDTO } from '../types/dtos/inventory.dto';
import { calculateWeightedAverageCost } from '../utils/inventory-valuation.util';

export class InventoryService {
  private readonly inventorySelect = {
    ingredientId: true,
    currentQuantity: true,
    costPerBaseUnit: true,
    expirationDate: true,
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
  } as const;

  async list(context: RequestContext): Promise<InventoryDTO.ListResponse> {
    const inventory = await prisma.userInventory.findMany({
      where: { userId: context.userId },
      orderBy: {
        ingredient: {
          name: 'asc',
        },
      },
      select: this.inventorySelect,
    });

    return { inventory };
  }

  async selectByIngredient(
    context: RequestContext,
    ingredientId: number,
  ): Promise<InventoryDTO.SelectByIngredientResponse> {
    const item = await prisma.userInventory.findUnique({
      where: {
        userId_ingredientId: {
          userId: context.userId,
          ingredientId,
        },
      },
      select: this.inventorySelect,
    });

    if (!item) {
      throw new NotFoundError('Inventory item not found', 'RESOURCE_NOT_FOUND');
    }

    return { inventory: item };
  }

  async registerPurchase(
    context: RequestContext,
    data: InventoryDTO.PurchaseRequest,
  ): Promise<InventoryDTO.PurchaseResponse> {
    return prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: data.ingredientId },
        select: { id: true, baseUnit: true },
      });

      if (!ingredient) {
        throw new NotFoundError('Ingredient not found', 'RESOURCE_NOT_FOUND');
      }

      const currentInventory = await tx.userInventory.findUnique({
        where: {
          userId_ingredientId: {
            userId: context.userId,
            ingredientId: data.ingredientId,
          },
        },
      });

      const purchasedQuantity = new Prisma.Decimal(data.quantity);
      const totalCostDecimal = new Prisma.Decimal(data.totalCost);
      const purchasedUnitCost = totalCostDecimal.dividedBy(purchasedQuantity);

      const currentQty = currentInventory
        ? currentInventory.currentQuantity
        : new Prisma.Decimal(0);
      const currentCost = currentInventory
        ? currentInventory.costPerBaseUnit
        : new Prisma.Decimal(0);

      const newCostPerBaseUnit = calculateWeightedAverageCost(
        currentQty,
        currentCost,
        purchasedQuantity,
        purchasedUnitCost,
      );

      const newQuantity = currentQty.plus(purchasedQuantity);

      const purchaseExpDate = data.expirationDate ? new Date(data.expirationDate) : null;
      let finalExpirationDate: Date | null = null;

      if (currentInventory && currentQty.gt(0) && currentInventory.expirationDate) {
        if (purchaseExpDate) {
          finalExpirationDate =
            currentInventory.expirationDate < purchaseExpDate
              ? currentInventory.expirationDate
              : purchaseExpDate;
        } else {
          finalExpirationDate = currentInventory.expirationDate;
        }
      } else {
        finalExpirationDate = purchaseExpDate;
      }

      const transaction = await tx.inventoryTransaction.create({
        data: {
          userId: context.userId,
          ingredientId: data.ingredientId,
          transactionType: 'PURCHASE',
          quantityChanged: purchasedQuantity,
          measurementUnit: ingredient.baseUnit,
          unitCost: purchasedUnitCost.toDecimalPlaces(4),
          totalCost: totalCostDecimal.toDecimalPlaces(2),
          expirationDate: purchaseExpDate,
        },
      });

      const updatedInventory = await tx.userInventory.upsert({
        where: {
          userId_ingredientId: {
            userId: context.userId,
            ingredientId: data.ingredientId,
          },
        },
        create: {
          userId: context.userId,
          ingredientId: data.ingredientId,
          currentQuantity: newQuantity,
          costPerBaseUnit: newCostPerBaseUnit,
          expirationDate: finalExpirationDate,
        },
        update: {
          currentQuantity: newQuantity,
          costPerBaseUnit: newCostPerBaseUnit,
          expirationDate: finalExpirationDate,
        },
        select: this.inventorySelect,
      });

      return {
        inventory: updatedInventory,
        transaction,
      };
    });
  }

  async registerAdjustment(
    context: RequestContext,
    data: InventoryDTO.AdjustmentRequest,
  ): Promise<InventoryDTO.AdjustmentResponse> {
    return prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: data.ingredientId },
        select: { id: true, baseUnit: true },
      });

      if (!ingredient) {
        throw new NotFoundError('Ingredient not found', 'RESOURCE_NOT_FOUND');
      }

      const currentInventory = await tx.userInventory.findUnique({
        where: {
          userId_ingredientId: {
            userId: context.userId,
            ingredientId: data.ingredientId,
          },
        },
        select: this.inventorySelect,
      });

      const currentQty = currentInventory
        ? currentInventory.currentQuantity
        : new Prisma.Decimal(0);
      const realQty = new Prisma.Decimal(data.realQuantity);
      const deltaQ = realQty.minus(currentQty);

      if (deltaQ.isZero()) {
        if (currentInventory) {
          return {
            inventory: currentInventory,
            transaction: null,
          };
        }

        const initialInventory = await tx.userInventory.create({
          data: {
            userId: context.userId,
            ingredientId: data.ingredientId,
            currentQuantity: realQty,
            costPerBaseUnit: 0,
            expirationDate: null,
          },
          select: this.inventorySelect,
        });

        return {
          inventory: initialInventory,
          transaction: null,
        };
      }

      const unitCost = currentInventory ? currentInventory.costPerBaseUnit : new Prisma.Decimal(0);
      const evaluatedTotalCost = deltaQ.abs().times(unitCost).toDecimalPlaces(2);

      const transaction = await tx.inventoryTransaction.create({
        data: {
          userId: context.userId,
          ingredientId: data.ingredientId,
          transactionType: 'MANUAL_ADJUSTMENT',
          quantityChanged: deltaQ,
          measurementUnit: ingredient.baseUnit,
          unitCost: unitCost.toDecimalPlaces(4),
          totalCost: evaluatedTotalCost,
          expirationDate: currentInventory?.expirationDate ?? null,
        },
      });

      const updatedInventory = await tx.userInventory.upsert({
        where: {
          userId_ingredientId: {
            userId: context.userId,
            ingredientId: data.ingredientId,
          },
        },
        create: {
          userId: context.userId,
          ingredientId: data.ingredientId,
          currentQuantity: realQty,
          costPerBaseUnit: unitCost,
          expirationDate: null,
        },
        update: {
          currentQuantity: realQty,
        },
        select: this.inventorySelect,
      });

      return {
        inventory: updatedInventory,
        transaction,
      };
    });
  }

  async registerWaste(
    context: RequestContext,
    data: InventoryDTO.WasteRequest,
  ): Promise<InventoryDTO.WasteResponse> {
    return prisma.$transaction(async (tx) => {
      const currentInventory = await tx.userInventory.findUnique({
        where: {
          userId_ingredientId: {
            userId: context.userId,
            ingredientId: data.ingredientId,
          },
        },
        select: this.inventorySelect,
      });

      if (!currentInventory) {
        throw new NotFoundError('Inventory item not found', 'RESOURCE_NOT_FOUND');
      }

      const wasteQty = new Prisma.Decimal(data.quantity);

      if (currentInventory.currentQuantity.lt(wasteQty)) {
        throw new DefaultAppError('Insufficient stock for this operation', 'INSUFFICIENT_STOCK');
      }

      const unitCost = currentInventory.costPerBaseUnit;
      const lossValue = wasteQty.times(unitCost).toDecimalPlaces(2);
      const newQuantity = currentInventory.currentQuantity.minus(wasteQty);

      const transaction = await tx.inventoryTransaction.create({
        data: {
          userId: context.userId,
          ingredientId: data.ingredientId,
          transactionType: 'WASTE',
          quantityChanged: wasteQty.negated(),
          measurementUnit: currentInventory.ingredient.baseUnit,
          unitCost: unitCost.toDecimalPlaces(4),
          totalCost: lossValue,
          expirationDate: currentInventory.expirationDate,
        },
      });

      const updatedInventory = await tx.userInventory.update({
        where: {
          userId_ingredientId: {
            userId: context.userId,
            ingredientId: data.ingredientId,
          },
        },
        data: {
          currentQuantity: newQuantity,
        },
        select: this.inventorySelect,
      });

      return {
        inventory: updatedInventory,
        transaction,
      };
    });
  }

  async listTransactions(
    context: RequestContext,
    query?: InventoryDTO.TransactionQueryRequest,
  ): Promise<InventoryDTO.TransactionListResponse> {
    const page = query?.page ?? 0;
    const limit = query?.limit ?? 50;
    const skip = page > 0 ? page * limit : 0;

    const where: Prisma.InventoryTransactionWhereInput = {
      userId: context.userId,
    };

    if (query?.ingredientId) {
      where.ingredientId = query.ingredientId;
    }

    if (query?.transactionType) {
      where.transactionType = query.transactionType;
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        ingredientId: true,
        productionId: true,
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
        production: {
          select: {
            id: true,
            yieldProduced: true,
            recipe: {
              select: {
                id: true,
                title: true,
                yieldUnit: true,
              },
            },
          },
        },
      },
    });

    return { transactions };
  }
}
