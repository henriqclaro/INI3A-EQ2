import { FullRecipe } from '../types/recipe';
import { api } from './api';

export interface RecipeResponse {
  data: {
    recipe: FullRecipe;
  };
}

export const RecipeService = {
  getRecipe: async (recipeId: string) => {
    const response = await api.get<RecipeResponse>(`/recipes/${recipeId}`);
    return response.data;
  },
};
