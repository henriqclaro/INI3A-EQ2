export interface PartialIngredient {
  id: number | string;
  name: string;
  category: string;
  slug?: string;
  aliases?: string[];
  baseDimension?: string;
  baseUnit?: string;
  description?: string | null;
}

export interface RecipeIngredient {
  ingredientId: number | string;
  baseQuantity: number;
  measurementUnit: string;
  notes?: string | null;
  ingredient: PartialIngredient;
}

export interface RecipeIngredientInput {
  ingredientId: number | string;
  baseQuantity: number;
  measurementUnit: string;
  notes?: string | null;
}
