import { PartialRecipe, PartialTag } from '../types';
import { api } from './api';

export interface UserRecipesResponse {
  data: {
    recipes: PartialRecipe[];
  };
}

export const UserService = {
  getRecipes: async (userId: string) => {
    const response = await api.get<UserRecipesResponse>(`/users/${userId}/recipes`);
    return response.data;
  },
};
