import type { Decimal } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type { StandardUnit } from '../../generated/prisma/client';
import type * as analytics from '../../validation/analytics.schema';

export namespace AnalyticsDTO {
  // Request DTOs
  export type ProfitSummaryQuery = z.infer<typeof analytics.profitSummaryQuerySchema>;
  export type PurchaseProjectionRequest = z.infer<typeof analytics.purchaseProjectionSchema>;

  // Response DTOs
  export interface ProfitSummaryCostBreakdown {
    ingredientCost: Decimal;
    laborCost: Decimal;
    overheadCost: Decimal;
    packagingCost: Decimal;
    totalProductionCost: Decimal;
  }

  export interface ProfitSummaryData {
    startDate: string;
    endDate: string;
    totalProductions: number;
    projectedRevenue: Decimal;
    totalProductionCost: Decimal;
    wasteCost: Decimal;
    netProfit: Decimal;
    achievedMarginPercent: Decimal;
    costBreakdown: ProfitSummaryCostBreakdown;
  }

  export interface ProfitSummaryResponse {
    summary: ProfitSummaryData;
  }

  export interface PurchaseProjectionDeficitItem {
    ingredientId: number;
    name: string;
    unit: StandardUnit;
    requiredQuantity: Decimal;
    currentQuantity: Decimal;
    deficitQuantity: Decimal;
    costPerBaseUnit: Decimal;
    estimatedCost: Decimal;
    unestimated: boolean;
  }

  export interface PurchaseProjectionData {
    totalItemsToPurchase: number;
    totalEstimatedExpenditure: Decimal;
    items: PurchaseProjectionDeficitItem[];
  }

  export interface PurchaseProjectionResponse {
    projection: PurchaseProjectionData;
  }
}
