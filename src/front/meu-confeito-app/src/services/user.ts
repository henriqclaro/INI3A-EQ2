import { PartialRecipe, UserInventoryItem } from '../types';
import { api } from './api';

export { UserInventoryItem };

export interface UserRegisterData {
  name: string;
  email: string;
  phone?: string | null | undefined;
  password: string;
  role: 'BAKER' | 'CUSTOMER';
}

export interface UserEditData {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | null | undefined;
}

export interface UserEditResponse {
  data: {
    user: {
      id?: string;
      name: string;
      email: string;
      phone: string | null;
      pfpUrl: string | null;
      role?: string;
      updatedAt: Date;
      isActive: boolean;
    };
  };
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

export interface SelectUserInventoryResponse {
  data: {
    userInventories: UserInventoryItem[];
  };
}

export interface RegisterUserInventoryData {
  ingredientId: string;
  measurementUnit: string;
  currentQuantity?: number;
  packagePrice?: number;
  packageSize?: number;
  costUnit?: number;
}

export interface RegisterUserInventoryResponse {
  data: {
    userInventory: UserInventoryItem;
  };
}

export const UserService = {
  register: async (data: UserRegisterData) => {
    const response = await api.post<UserRegisterResponse>('/users', data);
    return response.data;
  },
  edit: async (data: UserEditData, userId: string) => {
    const response = await api.patch<UserEditResponse>(`/users/${userId}`, data);
    return response.data;
  },
  delete: async (userId: string) => {
    const response = await api.delete(`/user/${userId}`, { data: { state: 'DELETED' } });
    return response.data;
  },
  getRecipes: async (userId: string) => {
    const response = await api.get<UserRecipesResponse>(`/users/${userId}/recipes`);
    return response.data;
  },
  getInventory: async (userId: string) => {
    const response = await api.get<SelectUserInventoryResponse>(`/users/${userId}/inventories`);
    return response.data;
  },
  registerInventory: async (userId: string, data: RegisterUserInventoryData) => {
    const response = await api.post<RegisterUserInventoryResponse>(
      `/users/${userId}/inventories`,
      data,
    );
    return response.data;
  },
};
