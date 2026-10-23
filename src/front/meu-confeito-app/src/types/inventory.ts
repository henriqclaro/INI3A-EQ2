export type InventoryMovement =
  | 'PURCHASE'
  | 'PRODUCTION_USAGE'
  | 'PRODUCTION_REVERSAL'
  | 'WASTE'
  | 'MANUAL_ADJUSTMENT';

export interface InventoryIngredient {
  id: number;
  name: string;
  slug: string;
  category: string;
  baseDimension: string;
  baseUnit: string;
  description: string | null;
}

export interface InventoryItem {
  ingredientId: number;
  currentQuantity: number | string;
  costPerBaseUnit: number | string;
  expirationDate: string | Date | null;
  lastUpdated: string | Date;
  ingredient: InventoryIngredient;
}

// For backwards compatibility across older imports
export type UserInventoryItem = InventoryItem;

export interface TransactionItem {
  id: string;
  userId: string;
  ingredientId: number;
  productionId: string | null;
  transactionType: InventoryMovement;
  quantityChanged: number | string;
  measurementUnit: string;
  unitCost: number | string;
  totalCost: number | string;
  expirationDate: string | Date | null;
  createdAt: string | Date;
  ingredient?: {
    id: number;
    name: string;
    slug: string;
    baseUnit: string;
  };
  production?: {
    id: string;
    yieldProduced: number | string;
    recipe: {
      id: string;
      title: string;
      yieldUnit: string;
    };
  } | null;
}

export interface PurchaseRequest {
  ingredientId: number;
  quantity: number;
  totalCost: number;
  expirationDate?: string;
}

export interface AdjustmentRequest {
  ingredientId: number;
  realQuantity: number;
  notes?: string;
}

export interface WasteRequest {
  ingredientId: number;
  quantity: number;
  notes?: string;
}

export interface TransactionQueryRequest {
  page?: number;
  limit?: number;
  ingredientId?: number;
  transactionType?: InventoryMovement;
}

export interface InventoryListResponse {
  data: {
    inventory: InventoryItem[];
  };
}

export interface InventoryItemResponse {
  data: {
    inventory: InventoryItem;
  };
}

export interface PurchaseResponse {
  data: {
    inventory: InventoryItem;
    transaction: TransactionItem;
  };
}

export interface AdjustmentResponse {
  data: {
    inventory: InventoryItem;
    transaction: TransactionItem | null;
  };
}

export interface WasteResponse {
  data: {
    inventory: InventoryItem;
    transaction: TransactionItem;
  };
}

export interface TransactionListResponse {
  data: {
    transactions: TransactionItem[];
  };
}
