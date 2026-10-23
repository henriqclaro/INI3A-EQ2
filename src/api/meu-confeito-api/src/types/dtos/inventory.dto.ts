import type { Decimal } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type { InventoryMovement, StandardUnit } from '../../generated/prisma/client';
import type * as inventory from '../../validation/inventory.schema';

export namespace InventoryDTO {
  // Request DTOs
  export type RequestParams = z.infer<typeof inventory.paramsSchema>;
  export type PurchaseRequest = z.infer<typeof inventory.purchaseSchema>;
  export type AdjustmentRequest = z.infer<typeof inventory.adjustmentSchema>;
  export type WasteRequest = z.infer<typeof inventory.wasteSchema>;
  export type TransactionQueryRequest = z.infer<typeof inventory.transactionQuerySchema>;

  // Entity Interfaces
  export interface InventoryItem {
    ingredientId: number;
    currentQuantity: Decimal;
    costPerBaseUnit: Decimal;
    expirationDate: Date | null;
    lastUpdated: Date;
    ingredient: {
      id: number;
      name: string;
      slug: string;
      category: string;
      baseDimension: string;
      baseUnit: string;
      description: string | null;
    };
  }

  export interface TransactionItem {
    id: string;
    userId: string;
    ingredientId: number;
    productionId: string | null;
    transactionType: InventoryMovement;
    quantityChanged: Decimal;
    measurementUnit: StandardUnit;
    unitCost: Decimal;
    totalCost: Decimal;
    expirationDate: Date | null;
    createdAt: Date;
    ingredient?: {
      id: number;
      name: string;
      slug: string;
      baseUnit: string;
    };
    production?: {
      id: string;
      yieldProduced: Decimal;
      recipe: {
        id: string;
        title: string;
        yieldUnit: StandardUnit;
      };
    } | null;
  }

  // Response DTOs
  export interface ListResponse {
    inventory: InventoryItem[];
  }

  export interface SelectByIngredientResponse {
    inventory: InventoryItem;
  }

  export interface PurchaseResponse {
    inventory: InventoryItem;
    transaction: TransactionItem;
  }

  export interface AdjustmentResponse {
    inventory: InventoryItem;
    transaction: TransactionItem | null;
  }

  export interface WasteResponse {
    inventory: InventoryItem;
    transaction: TransactionItem;
  }

  export interface TransactionListResponse {
    transactions: TransactionItem[];
  }
}
