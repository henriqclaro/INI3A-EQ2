import { Tag, TagType } from '../types/tag';
import { api } from './api';

export interface TagSearchResponse {
  data: {
    tags: Tag[];
  };
  message?: string;
}

export const TagService = {
  search: async (search?: string, page?: number, type?: TagType) => {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    if (page !== undefined) {
      params.append('page', page.toString());
    }
    if (type) {
      params.append('type', type);
    }

    const queryString = params.toString();
    const url = queryString ? `/tags?${queryString}` : '/tags';
    const response = await api.get<TagSearchResponse>(url);
    return response.data;
  },
};
