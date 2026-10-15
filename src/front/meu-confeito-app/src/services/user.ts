import {
  PartialRecipe,
  RecipeStatus,
  SaveRecipeResponse,
  SelectUserReviewsResponse,
  SelectUserSavesResponse,
  UserInventoryItem,
} from '../types';
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
  pfpUrl?: string | null | undefined;
}

export interface AvatarUploadResponse {
  data: {
    url: string;
  };
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

export interface SearchUserItem {
  id: string;
  name: string;
  role: 'ADMIN' | 'BAKER' | 'CUSTOMER' | 'MODERATOR';
  pfpUrl: string | null;
  publicName: string | null;
  recipes: string[];
}

export interface SearchUsersResponse {
  data: {
    users: SearchUserItem[];
  };
}

export interface SearchUsersParams {
  email?: string;
  search?: string;
  page?: number;
}

export const UserService = {
  register: async (data: UserRegisterData) => {
    const response = await api.post<UserRegisterResponse>('/users', data);
    return response.data;
  },
  getById: async (userId: string) => {
    const response = await api.get<UserEditResponse>(`/users/${userId}`);
    return response.data;
  },
  edit: async (data: UserEditData, userId: string) => {
    const response = await api.patch<UserEditResponse>(`/users/${userId}`, data);
    return response.data;
  },
  uploadAvatar: async (formData: FormData) => {
    const response = await api.patch<AvatarUploadResponse>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteAvatar: async () => {
    const response = await api.delete('/users/me/avatar');
    return response.data;
  },
  /**
   * Voluntary self-deletion (CUSTOMER/BAKER) or administrative deletion (ADMIN).
   */
  delete: async (userId: string) => {
    const response = await api.delete(`/users/${userId}`, { data: { state: 'DELETED' } });
    return response.data;
  },
  /**
   * Punitive moderation ban / suspension executed by MODERATOR or ADMIN.
   * Users cannot ban themselves (403 Forbidden).
   */
  suspend: async (userId: string) => {
    const response = await api.delete(`/users/${userId}`, { data: { state: 'SUSPENDED' } });
    return response.data;
  },
  ban: async (userId: string) => {
    const response = await api.delete(`/users/${userId}`, { data: { state: 'SUSPENDED' } });
    return response.data;
  },
  searchUsers: async (params?: SearchUsersParams) => {
    const searchParams = new URLSearchParams();
    if (params?.email) {
      searchParams.append('email', params.email);
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }
    if (params?.page !== undefined) {
      searchParams.append('page', params.page.toString());
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    const response = await api.get<SearchUsersResponse>(url);
    return response.data;
  },
  getRecipes: async (userId: string, status?: RecipeStatus, page?: number) => {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    if (page !== undefined) {
      params.append('page', page.toString());
    }
    const queryString = params.toString();
    const url = queryString
      ? `/users/${userId}/recipes?${queryString}`
      : `/users/${userId}/recipes`;
    const response = await api.get<UserRecipesResponse>(url);
    return response.data;
  },
  getInventory: async (_userId?: string) => {
    const response = await api.get<{ data: { inventory: UserInventoryItem[] } }>('/inventory');
    return {
      data: {
        userInventories: response.data.data?.inventory ?? [],
      },
    };
  },
  registerInventory: async (_userId: string, data: RegisterUserInventoryData) => {
    const quantity = data.currentQuantity ?? data.packageSize ?? 1;
    const totalCost = data.packagePrice ?? (data.costUnit ? data.costUnit * quantity : 0);
    const response = await api.post<{ data: { inventory: UserInventoryItem } }>(
      '/inventory/purchases',
      {
        ingredientId: Number(data.ingredientId),
        quantity,
        totalCost,
      },
    );
    return {
      data: {
        userInventory: response.data.data.inventory,
      },
    };
  },
  getSavedRecipes: async (userId: string) => {
    const response = await api.get<SelectUserSavesResponse>(`/users/${userId}/saves`);
    return response.data;
  },
  saveRecipe: async (userId: string, recipeId: string) => {
    const response = await api.post<SaveRecipeResponse>(`/users/${userId}/saves`, { recipeId });
    return response.data;
  },
  removeSavedRecipe: async (userId: string, recipeId: string) => {
    const response = await api.delete(`/users/${userId}/saves`, { data: { recipeId } });
    return response.data;
  },
  getUserReviews: async (userId: string) => {
    const response = await api.get<SelectUserReviewsResponse>(`/users/${userId}/reviews`);
    return response.data;
  },
};
