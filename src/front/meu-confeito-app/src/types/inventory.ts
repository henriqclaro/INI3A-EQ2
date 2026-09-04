import { PartialIngredient } from './ingredient';

export interface UserInventoryItem {
  ingredientId: string;
  currentQuantity: number;
  measurementUnit: string;
  packagePrice: number;
  packageSize: number;
  costUnit: number;
  lastUpdated: Date | string;
  ingredient: PartialIngredient & {
    description?: string | null;
  };
}
