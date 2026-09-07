import type { Decimal } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type { InventoryMovement, StandardUnit } from '../../generated/prisma/client';
import type * as production from '../../validation/production.schema';

export namespace ProductionDTO {
  // Request DTOs
  export type RequestParams = z.infer<typeof production.paramsSchema>;
  export type RegisterRequest = z.infer<typeof production.registerProductionSchema>;
  export type QueryRequest = z.infer<typeof production.querySchema>;

  // Entity Interfaces
  export interface ProductionTransaction {
    id: string;
    ingredientId: number;
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
      baseUnit: StandardUnit;
    };
  }

  export interface ProductionItem {
    id: string;
    userId: string;
    recipeId: string;
    yieldProduced: Decimal;
    productionDate: Date;
    expirationDate: Date | null;
    canceledAt: Date | null;
    ingredientCost: Decimal;
    laborCost: Decimal;
    overheadCost: Decimal;
    packagingCost: Decimal;
    totalCost: Decimal;
    unitCost: Decimal;
    recipe?: {
      id: string;
      title: string;
      yieldUnit: StandardUnit;
      baseYield: Decimal;
    };
    transactions?: ProductionTransaction[];
  }

  // Response DTOs
  export interface RegisterResponse {
    production: ProductionItem;
  }

  export interface SelectResponse {
    production: ProductionItem;
  }

  export interface ListResponse {
    productions: ProductionItem[];
  }

  export interface CancelResponse {
    production: ProductionItem;
  }
}
