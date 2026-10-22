import { PartialIngredient } from './ingredient';

export type StockEntryMode = 'purchase' | 'adjustment';

export interface StockEntryItem {
  id: string;
  selectedIngredientId: string;
  selectedIngredient: PartialIngredient | null;
  quantityInput: string;
  totalCostInput: string;
  expirationDate: Date | null;
  notesInput: string;
  isPackageHelperEnabled: boolean;
  packageCount: string;
  packageSize: string;
  hasTouchedIngredient: boolean;
}

export interface StockEntryDraftItem {
  id: string;
  selectedIngredientId: string;
  selectedIngredient: PartialIngredient | null;
  quantityInput: string;
  totalCostInput: string;
  expirationDate: string | null;
  notesInput: string;
  isPackageHelperEnabled: boolean;
  packageCount: string;
  packageSize: string;
}

export interface StockRegisterDraft {
  entryMode: StockEntryMode;
  items: StockEntryDraftItem[];
}

export function createEmptyStockEntryItem(): StockEntryItem {
  return {
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    selectedIngredientId: '',
    selectedIngredient: null,
    quantityInput: '',
    totalCostInput: '',
    expirationDate: null,
    notesInput: '',
    isPackageHelperEnabled: false,
    packageCount: '1',
    packageSize: '',
    hasTouchedIngredient: false,
  };
}

export function serializeStockEntryItem(item: StockEntryItem): StockEntryDraftItem {
  return {
    id: item.id,
    selectedIngredientId: item.selectedIngredientId,
    selectedIngredient: item.selectedIngredient,
    quantityInput: item.quantityInput,
    totalCostInput: item.totalCostInput,
    expirationDate: item.expirationDate ? item.expirationDate.toISOString() : null,
    notesInput: item.notesInput,
    isPackageHelperEnabled: item.isPackageHelperEnabled,
    packageCount: item.packageCount,
    packageSize: item.packageSize,
  };
}

export function deserializeStockEntryItem(draft: StockEntryDraftItem): StockEntryItem {
  return {
    id: draft.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    selectedIngredientId: draft.selectedIngredientId || '',
    selectedIngredient: draft.selectedIngredient || null,
    quantityInput: draft.quantityInput || '',
    totalCostInput: draft.totalCostInput || '',
    expirationDate: draft.expirationDate ? new Date(draft.expirationDate) : null,
    notesInput: draft.notesInput || '',
    isPackageHelperEnabled: Boolean(draft.isPackageHelperEnabled),
    packageCount: draft.packageCount || '1',
    packageSize: draft.packageSize || '',
    hasTouchedIngredient: Boolean(draft.selectedIngredientId),
  };
}
