import { RecipeIngredient } from './ingredient';
import { PartialTag } from './tag';

export interface PartialRecipe {
  id: string;
  title: string;
  coverUrl: string | null;
  prepTimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  tags: {
    tag: PartialTag;
  }[];
}

export interface FullRecipe {
  id: string;
  userId: string | null;
  parentId: string | null;
  title: string;
  coverUrl: string | null;
  instructions: JSON;
  baseYield: string;
  yieldUnit: string;

  status: string;
  totalSaves: number;
  totalReviews: number;
  averageRating: string;

  profitMargin: string;
  overhead: string;
  prepTimeMinutes: number;
  hourlyLabor: string;
  packagingCost: string;

  createdAt: Date;
  updatedAt: Date;

  ingredients: RecipeIngredient[];
}

export interface RecipeRegisterInput {
  userId: string;
  parentId?: string | null;
  title: string;
  coverUrl?: string | null;
  instructions: Record<string, any> | { text: string }[] | any;
  baseYield: number;
  yieldUnit: string;
  profitMargin?: number;
  overhead?: number;
  prepTimeMinutes?: number;
  hourlyLabor?: number;
  packagingCost?: number;
  ingredients: {
    ingredientId: string;
    baseQuantity: number;
    measurementUnit: string;
    notes?: string | null;
  }[];
}

export interface RecipeRegisterResponseData {
  recipe: {
    id: string;
    userId: string | null;
    parentId: string | null;
    title: string;
    coverUrl: string | null;
    instructions: any;
    baseYield: number | string;
    yieldUnit: string;
    profitMargin?: number | string;
    overhead?: number | string;
    prepTimeMinutes?: number;
    hourlyLabor?: number | string;
    packagingCost?: number | string;
    createdAt: Date | string;
    ingredients: {
      ingredientId: string;
      baseQuantity: number | string;
      measurementUnit: string;
      notes: string | null;
    }[];
  };
}
