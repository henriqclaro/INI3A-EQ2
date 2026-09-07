export interface PartialIngredient {
  id: string;
  name: string[];
  category: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  baseQuantity: number;
  measurementUnit: string;
  notes: string;
  ingredient: PartialIngredient;
}

export interface RecipeIngredientInput {
  ingredientId: string;
  baseQuantity: number;
  measurementUnit: string;
  notes?: string | null;
}
