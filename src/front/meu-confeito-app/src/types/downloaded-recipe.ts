import { FullRecipe } from './recipe';

export interface DownloadedRecipe {
  id: string;
  recipe: FullRecipe;
  downloadedAt: string;
  recipeUpdatedAt: string;
  isOwner: boolean;
}

export interface ClearDownloadedRecipesResult {
  isSuccess: boolean;
  clearedCount: number;
}
