import {
  ProductionListResponse,
  ProductionQueryParams,
  ProductionResponse,
  RegisterProductionInput,
} from '../types/production';
import { api } from './api';

export const ProductionService = {
  register: async (data: RegisterProductionInput) => {
    const response = await api.post<ProductionResponse>('/productions', data);
    return response.data;
  },

  list: async (params?: ProductionQueryParams) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) {
      query.append('page', params.page.toString());
    }
    if (params?.limit !== undefined) {
      query.append('limit', params.limit.toString());
    }
    if (params?.recipeId) {
      query.append('recipeId', params.recipeId);
    }
    if (params?.includeCanceled !== undefined) {
      query.append('includeCanceled', params.includeCanceled.toString());
    }

    const queryString = query.toString();
    const url = queryString ? `/productions?${queryString}` : '/productions';
    const response = await api.get<ProductionListResponse>(url);
    return response.data;
  },

  getSingle: async (id: string) => {
    const response = await api.get<ProductionResponse>(`/productions/${id}`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.post<ProductionResponse>(`/productions/${id}/cancel`);
    return response.data;
  },
};
