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

export interface RecipeCoverUploadResponse {
  data: {
    url: string;
  };
}

export interface RecipeSearchParams {
  search?: string;
  page?: number;
  sort?: string;
  dateLimit?: number;
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
  search: async (
    searchOrParams?: string | RecipeSearchParams,
    page?: number,
    sort?: string,
    dateLimit?: number,
  ) => {
    const params = new URLSearchParams();
    let searchQuery: string | undefined;
    let pageNum: number | undefined;
    let sortOption: string | undefined;
    let dateLimitDays: number | undefined;

    if (typeof searchOrParams === 'object' && searchOrParams !== null) {
      searchQuery = searchOrParams.search;
      pageNum = searchOrParams.page;
      sortOption = searchOrParams.sort;
      dateLimitDays = searchOrParams.dateLimit;
    } else {
      searchQuery = searchOrParams;
      pageNum = page;
      sortOption = sort;
      dateLimitDays = dateLimit;
    }

    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (pageNum !== undefined) {
      params.append('page', pageNum.toString());
    }
    if (sortOption) {
      params.append('sort', sortOption);
    }
    if (dateLimitDays !== undefined && dateLimitDays > 0) {
      params.append('date_limit', dateLimitDays.toString());
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
  uploadCover: async (recipeId: string, formData: FormData) => {
    const response = await api.patch<RecipeCoverUploadResponse>(
      `/recipes/${recipeId}/cover`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },
  deleteCover: async (recipeId: string) => {
    const response = await api.delete(`/recipes/${recipeId}/cover`);
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
