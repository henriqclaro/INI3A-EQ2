export interface ShowcaseRecipeData {
  id: string;
  title: string;
  coverUrl: string | null;
  averageRating: number | string;
  totalReviews: number;
  status?: string;
}

export interface ShowcaseRecipeItem {
  userId: string;
  recipeId: string;
  order: number | null;
  createdAt: Date | string;
  recipe: ShowcaseRecipeData;
}

export interface ShowcaseListResponse {
  data: {
    showcase: ShowcaseRecipeItem[];
  };
  message?: string;
}

export interface ShowcaseItemResponse {
  data: {
    showcaseItem: ShowcaseRecipeItem;
  };
  message?: string;
}

export interface AddShowcaseInput {
  recipeId: string;
  order?: number;
}

export interface ReorderShowcaseItem {
  recipeId: string;
  order: number;
}

export interface ReorderShowcaseInput {
  items: ReorderShowcaseItem[];
}
