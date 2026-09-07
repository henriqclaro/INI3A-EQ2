import { StandardUnit } from './recipe';

export interface ProductionTransaction {
  id: string;
  ingredientId: number;
  transactionType: string;
  quantityChanged: number | string;
  measurementUnit: StandardUnit | string;
  unitCost: number | string;
  totalCost: number | string;
  expirationDate: Date | string | null;
  createdAt: Date | string;
  ingredient?: {
    id: number;
    name: string;
    slug?: string;
    baseUnit: StandardUnit | string;
  };
}

export interface ProductionItem {
  id: string;
  userId: string;
  recipeId: string;
  yieldProduced: number | string;
  productionDate: Date | string;
  expirationDate: Date | string | null;
  canceledAt: Date | string | null;
  ingredientCost: number | string;
  laborCost: number | string;
  overheadCost: number | string;
  packagingCost: number | string;
  totalCost: number | string;
  unitCost: number | string;
  recipe?: {
    id: string;
    title: string;
    yieldUnit: StandardUnit | string;
    baseYield: number | string;
  };
  transactions?: ProductionTransaction[];
}

export interface RegisterProductionInput {
  recipeId: string;
  yieldProduced: number;
  expirationDate?: string;
}

export interface ProductionQueryParams {
  page?: number;
  limit?: number;
  recipeId?: string;
  includeCanceled?: boolean;
}

export interface ProductionResponse {
  data: {
    production: ProductionItem;
  };
  message?: string;
}

export interface ProductionListResponse {
  data: {
    productions: ProductionItem[];
  };
  message?: string;
}
