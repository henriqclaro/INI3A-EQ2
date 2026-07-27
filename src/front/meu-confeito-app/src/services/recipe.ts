import { FullRecipe, PartialRecipe } from '../types/recipe';
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
};
