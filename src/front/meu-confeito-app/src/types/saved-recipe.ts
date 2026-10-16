import { RecipeStatus } from './recipe';
import { PartialTag } from './tag';

export interface SavedRecipeDetail {
  id: string;
  title: string;
  coverUrl: string | null;
  profitMargin?: number | string;
  overhead?: number | string;
  hourlyLabor?: number | string;
  packagingCost?: number | string;
  prepTimeMinutes: number;
  status?: RecipeStatus | string;
  baseYield?: number | string;
  yieldUnit?: string;
  updatedAt?: string | Date;
  tags?: {
    tag: PartialTag;
  }[];
}

export interface UserSavedRecipeItem {
  savedAt: string | Date;
  recipe: SavedRecipeDetail;
}

export interface SelectUserSavesResponse {
  data: {
    userSaves: UserSavedRecipeItem[];
  };
}

export interface SaveRecipeRequest {
  recipeId: string;
}

export interface SaveRecipeResponse {
  data: {
    userSavedRecipe: {
      userId: string;
      recipeId: string;
      savedAt: string | Date;
    };
  };
}
