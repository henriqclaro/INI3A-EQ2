import { PartialRecipe } from '../types';
import { api } from './api';

export interface UserRegisterData {
  name: string;
  email: string;
  phone?: string | null | undefined;
  password: string;
  role: 'BAKER' | 'CUSTOMER';
}

export interface UserRegisterResponse {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: Date;
    };
  };
}

export interface UserRecipesResponse {
  data: {
    recipes: PartialRecipe[];
  };
}

export const UserService = {
  register: async (data: UserRegisterData) => {
    const response = await api.post<UserRegisterResponse>('/users', data);
    return response.data;
  },
  getRecipes: async (userId: string) => {
    const response = await api.get<UserRecipesResponse>(`/users/${userId}/recipes`);
    return response.data;
  },
};
