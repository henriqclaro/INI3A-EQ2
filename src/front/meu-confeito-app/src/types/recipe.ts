import { RecipeIngredient } from './ingredient';
import { PartialTag } from './tag';

export type StandardUnit = 'G' | 'KG' | 'ML' | 'L' | 'UN';

export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SUSPENDED';

export interface RecipeItem {
  id: string;
  ingredientId: number | null;
  subRecipeId: string | null;
  quantity: number | string;
  unit: StandardUnit | string;
  displayQuantity: number | string | null;
  displayUnit: string | null;
  sortOrder: number;
  notes: string | null;
  ingredient?: {
    id: number;
    name: string;
    slug?: string;
    category?: string;
    baseDimension?: string;
    baseUnit?: string;
    description?: string | null;
  } | null;
  subRecipe?: {
    id: string;
    title: string;
    baseYield: number | string;
    yieldUnit: string;
  } | null;
  inventory?: {
    currentQuantity: number | string;
    costPerBaseUnit: number | string;
    lastUpdated: Date | string;
  } | null;
}

export interface RecipeItemInput {
  ingredientId?: number | null;
  subRecipeId?: string | null;
  quantity: number;
  unit: StandardUnit;
  displayQuantity?: number | null;
  displayUnit?: string | null;
  sortOrder?: number;
  notes?: string | null;
}

export interface PartialRecipe {
  id: string;
  title: string;
  coverUrl: string | null;
  profitMargin?: number | string;
  overhead?: number | string;
  hourlyLabor?: number | string;
  packagingCost?: number | string;
  prepTimeMinutes: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  baseYield?: number | string;
  yieldUnit?: string;
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
  instructions: { steps?: { text: string }[] } | Record<string, unknown> | string | unknown;
  baseYield: number | string;
  yieldUnit: StandardUnit | string;

  status: RecipeStatus | string;
  totalSaves: number;
  totalReviews: number;
  averageRating: number | string;

  profitMargin: number | string;
  overhead: number | string;
  prepTimeMinutes: number;
  hourlyLabor: number | string;
  packagingCost: number | string;

  createdAt: Date | string;
  updatedAt: Date | string;

  items: RecipeItem[];
  /** Backward-compatibility alias for screens/components previously using ingredients */
  ingredients?: RecipeIngredient[] | RecipeItem[];
  tags?: {
    tag: PartialTag;
  }[];
}

export interface RecipeRegisterInput {
  userId?: string;
  parentId?: string | null;
  title: string;
  coverUrl?: string | null;
  instructions: Record<string, unknown>;
  baseYield: number;
  yieldUnit: StandardUnit;
  profitMargin?: number;
  overhead?: number;
  prepTimeMinutes?: number;
  hourlyLabor?: number;
  packagingCost?: number;
  items: RecipeItemInput[];
  tagIds?: number[];
}

export interface RecipeUpdateInput {
  title?: string;
  coverUrl?: string | null;
  instructions?: Record<string, unknown>;
  baseYield?: number;
  yieldUnit?: StandardUnit;
  profitMargin?: number;
  overhead?: number;
  prepTimeMinutes?: number;
  hourlyLabor?: number;
  packagingCost?: number;
  items?: RecipeItemInput[];
  tagIds?: number[];
}

export interface RecipeRegisterResponseData {
  recipe: {
    id: string;
    userId: string | null;
    parentId: string | null;
    title: string;
    coverUrl: string | null;
    instructions: unknown;
    baseYield: number | string;
    yieldUnit: StandardUnit | string;
    profitMargin?: number | string;
    overhead?: number | string;
    prepTimeMinutes?: number;
    hourlyLabor?: number | string;
    packagingCost?: number | string;
    createdAt: Date | string;
    items: {
      id: string;
      ingredientId: number | null;
      subRecipeId: string | null;
      quantity: number | string;
      unit: string;
      displayQuantity: number | string | null;
      displayUnit: string | null;
      sortOrder: number;
      notes: string | null;
    }[];
  };
}

export interface UpdateRecipeVisibilityInput {
  userId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface UpdateRecipeVisibilityResponseData {
  recipe: {
    id: string;
    userId: string | null;
    title: string;
    status: string;
    updatedAt: Date | string;
  };
}
