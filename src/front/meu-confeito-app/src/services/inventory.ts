import {
  AdjustmentRequest,
  AdjustmentResponse,
  InventoryItemResponse,
  InventoryListResponse,
  PurchaseRequest,
  PurchaseResponse,
  TransactionListResponse,
  TransactionQueryRequest,
  WasteRequest,
  WasteResponse,
} from '../types/inventory';
import { api } from './api';

export const InventoryService = {
  list: async () => {
    const response = await api.get<InventoryListResponse>('/inventory');
    return response.data;
  },

  selectByIngredient: async (ingredientId: number) => {
    const response = await api.get<InventoryItemResponse>(`/inventory/${ingredientId}`);
    return response.data;
  },

  registerPurchase: async (data: PurchaseRequest) => {
    const response = await api.post<PurchaseResponse>('/inventory/purchases', data);
    return response.data;
  },

  registerAdjustment: async (data: AdjustmentRequest) => {
    const response = await api.post<AdjustmentResponse>('/inventory/adjustments', data);
    return response.data;
  },

  registerWaste: async (data: WasteRequest) => {
    const response = await api.post<WasteResponse>('/inventory/waste', data);
    return response.data;
  },

  listTransactions: async (query?: TransactionQueryRequest) => {
    const response = await api.get<TransactionListResponse>('/inventory/transactions', {
      params: query,
    });
    return response.data;
  },
};
