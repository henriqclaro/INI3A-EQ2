import { PartialIngredient } from '../types/ingredient';
import { api } from './api';

export interface IngredientSearchResponse {
  data: {
    ingredients: PartialIngredient[];
  };
}

export const IngredientService = {
  search: async (search?: string, page?: number) => {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    if (page !== undefined) {
      params.append('page', page.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/ingredients?${queryString}` : '/ingredients';

    const response = await api.get<IngredientSearchResponse>(url);
    return response.data;
  },
};
