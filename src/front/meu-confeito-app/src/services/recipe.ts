import {
  FullRecipe,
  PartialRecipe,
  RecipeRegisterInput,
  RecipeRegisterResponseData,
} from '../types/recipe';
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

export const RecipeService = {
  getRecipe: async (recipeId: string) => {
    const response = await api.get<RecipeResponse>(`/recipes/${recipeId}`);
    return response.data;
  },
  search: async (search?: string) => {
    const response = search
      ? await api.get(`/recipes?search=${search}`)
      : await api.get('/recipes');
    return response.data;
  },
  register: async (data: RecipeRegisterInput) => {
    const response = await api.post<RecipeRegisterResponse>('/recipes', data);
    return response.data;
  },
};

