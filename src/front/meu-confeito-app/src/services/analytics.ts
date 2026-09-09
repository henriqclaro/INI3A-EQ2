import {
  ProfitSummaryQuery,
  ProfitSummaryResponse,
  PurchaseProjectionRequest,
  PurchaseProjectionResponse,
} from '../types/analytics';
import { api } from './api';

export const AnalyticsService = {
  getProfitSummary: async (params: ProfitSummaryQuery) => {
    const query = new URLSearchParams();
    query.append('startDate', params.startDate);
    query.append('endDate', params.endDate);

    const response = await api.get<ProfitSummaryResponse>(
      `/analytics/profit-summary?${query.toString()}`,
    );
    return response.data;
  },

  projectPurchases: async (data: PurchaseProjectionRequest) => {
    const response = await api.post<PurchaseProjectionResponse>(
      '/analytics/purchase-projection',
      data,
    );
    return response.data;
  },
};
