import { StandardUnit } from './recipe';

export interface ProfitSummaryQuery {
  startDate: string;
  endDate: string;
}

export interface ProfitSummaryCostBreakdown {
  ingredientCost: number | string;
  laborCost: number | string;
  overheadCost: number | string;
  packagingCost: number | string;
  totalProductionCost: number | string;
}

export interface ProfitSummaryData {
  startDate: string;
  endDate: string;
  totalProductions: number;
  projectedRevenue: number | string;
  totalProductionCost: number | string;
  wasteCost: number | string;
  netProfit: number | string;
  achievedMarginPercent: number | string;
  costBreakdown: ProfitSummaryCostBreakdown;
}

export interface ProfitSummaryResponse {
  status: string;
  message?: string;
  data: {
    summary: ProfitSummaryData;
  };
}

export interface PlannedProductionItem {
  recipeId: string;
  targetYield: number;
  recipeTitle?: string;
  baseYield?: number | string;
  yieldUnit?: string;
  origins?: ('OWN' | 'SAVED' | 'DOWNLOADED')[];
}

export interface PurchaseProjectionRequest {
  plannedProductions: {
    recipeId: string;
    targetYield: number;
  }[];
}

export interface PurchaseProjectionDeficitItem {
  ingredientId: number;
  name: string;
  unit: StandardUnit | string;
  requiredQuantity: number | string;
  currentQuantity: number | string;
  deficitQuantity: number | string;
  costPerBaseUnit: number | string;
  estimatedCost: number | string;
  unestimated: boolean;
}

export interface PurchaseProjectionData {
  totalItemsToPurchase: number;
  totalEstimatedExpenditure: number | string;
  items: PurchaseProjectionDeficitItem[];
}

export interface PurchaseProjectionResponse {
  status: string;
  message?: string;
  data: {
    projection: PurchaseProjectionData;
  };
}
