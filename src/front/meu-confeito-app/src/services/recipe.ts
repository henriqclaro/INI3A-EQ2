import {
  FullRecipe,
  PartialRecipe,
  RecipeRegisterInput,
  RecipeRegisterResponseData,
  RecipeUpdateInput,
  UpdateRecipeVisibilityInput,
  UpdateRecipeVisibilityResponseData,
} from '../types/recipe';
import { CreateReviewResponse, RecipeReviewsResponse, UpdateReviewResponse } from '../types/review';
import { api } from './api';

export interface RecipeResponse {
  data: {
    recipe: FullRecipe;
  };
}

export interface SearchResponse {
  data: {
    recipes: PartialRecipe[];
  };
}

export interface RecipeRegisterResponse {
  data: RecipeRegisterResponseData;
}

export interface RecipeVisibilityResponse {
  data: UpdateRecipeVisibilityResponseData;
}

export const RecipeService = {
  getRecipe: async (recipeId: string) => {
    const response = await api.get<RecipeResponse>(`/recipes/${recipeId}`);
    return response.data;
  },
  getRecipeWithUserInventory: async (recipeId: string, userId: string) => {
    const response = await api.get<RecipeResponse>(`/recipes/${recipeId}/users/${userId}`);
    return response.data;
  },
  search: async (search?: string, page?: number) => {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    if (page !== undefined) {
      params.append('page', page.toString());
    }
    const queryString = params.toString();
    const url = queryString ? `/recipes?${queryString}` : '/recipes';
    const response = await api.get<SearchResponse>(url);
    return response.data;
  },
  register: async (data: RecipeRegisterInput) => {
    const response = await api.post<RecipeRegisterResponse>('/recipes', data);
    return response.data;
  },
  updateVisibility: async (recipeId: string, data: UpdateRecipeVisibilityInput) => {
    const response = await api.patch<RecipeVisibilityResponse>(
      `/recipes/${recipeId}/visibility`,
      data,
    );
    return response.data;
  },
  update: async (recipeId: string, data: RecipeUpdateInput) => {
    const response = await api.patch<RecipeResponse>(`/recipes/${recipeId}`, data);
    return response.data;
  },
  getReviews: async (recipeId: string) => {
    const response = await api.get<RecipeReviewsResponse>(`/recipes/${recipeId}/reviews`);
    return response.data;
  },
  createReview: async (recipeId: string, rating: number) => {
    const response = await api.post<CreateReviewResponse>(`/recipes/${recipeId}/reviews`, {
      rating,
    });
    return response.data;
  },
  updateReview: async (recipeId: string, rating: number) => {
    const response = await api.patch<UpdateReviewResponse>(`/recipes/${recipeId}/reviews`, {
      rating,
    });
    return response.data;
  },
  deleteReview: async (recipeId: string) => {
    const response = await api.delete(`/recipes/${recipeId}/reviews`);
    return response.data;
  },
};
