export interface RecipeReviewUser {
  id: string;
  name: string;
  pfpUrl: string | null;
  updatedAt?: string | Date;
}

export interface RecipeReviewItem {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: RecipeReviewUser;
}

export interface RatingCounts {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface RecipeReviewsData {
  reviews: RecipeReviewItem[];
  totalReviews: number;
  averageRating: number | string;
  ratingCounts: RatingCounts;
}

export interface RecipeReviewsResponse {
  data: RecipeReviewsData;
}

export interface CreateReviewInput {
  rating: number;
}

export interface CreateReviewResponse {
  data: {
    review: RecipeReviewItem;
  };
}

export interface UpdateReviewInput {
  rating: number;
}

export interface UpdateReviewResponse {
  data: {
    review: RecipeReviewItem;
  };
}

export interface UserReviewSummaryRecipe {
  id: string;
  title: string;
  coverUrl: string | null;
  averageRating: number | string;
  totalReviews: number;
  updatedAt?: string | Date;
}

export interface UserReviewItem {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  recipe: UserReviewSummaryRecipe;
}

export interface SelectUserReviewsResponse {
  data: {
    reviews: UserReviewItem[];
  };
}
