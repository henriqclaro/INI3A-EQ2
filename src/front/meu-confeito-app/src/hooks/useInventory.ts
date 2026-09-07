import { useCallback, useEffect, useState } from 'react';

import { InventoryService } from '../services/inventory';
import {
  AdjustmentRequest,
  AdjustmentResponse,
  InventoryItem,
  PurchaseRequest,
  PurchaseResponse,
  TransactionItem,
  TransactionQueryRequest,
  WasteRequest,
  WasteResponse,
} from '../types/inventory';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await InventoryService.list();
      setInventory(res.data?.inventory ?? []);
    } catch (err: unknown) {
      console.error('Error fetching inventory:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(apiErr.response?.data?.message || apiErr.message || 'Erro ao carregar estoque.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await InventoryService.list();
        if (isMounted) {
          setInventory(res.data?.inventory ?? []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error fetching inventory:', err);
          const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
          setError(apiErr.response?.data?.message || apiErr.message || 'Erro ao carregar estoque.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const registerPurchase = async (data: PurchaseRequest): Promise<PurchaseResponse> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await InventoryService.registerPurchase(data);
      await fetchInventory();
      return res;
    } catch (err: unknown) {
      console.error('Error registering purchase:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        apiErr.response?.data?.message || apiErr.message || 'Erro ao registrar compra no estoque.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerAdjustment = async (data: AdjustmentRequest): Promise<AdjustmentResponse> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await InventoryService.registerAdjustment(data);
      await fetchInventory();
      return res;
    } catch (err: unknown) {
      console.error('Error registering adjustment:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        apiErr.response?.data?.message || apiErr.message || 'Erro ao registrar ajuste de estoque.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerWaste = async (data: WasteRequest): Promise<WasteResponse> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await InventoryService.registerWaste(data);
      await fetchInventory();
      return res;
    } catch (err: unknown) {
      console.error('Error registering waste:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        apiErr.response?.data?.message || apiErr.message || 'Erro ao registrar perda no estoque.';
      setError(msg);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    inventory,
    inventories: inventory,
    isLoading,
    isSubmitting,
    error,
    refetch: fetchInventory,
    registerPurchase,
    registerAdjustment,
    registerWaste,
    setInventory,
  };
}

export function useInventoryTransactions(query?: TransactionQueryRequest) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await InventoryService.listTransactions(query);
      setTransactions(res.data?.transactions ?? []);
    } catch (err: unknown) {
      console.error('Error fetching transactions:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(apiErr.response?.data?.message || apiErr.message || 'Erro ao carregar transações.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await InventoryService.listTransactions(query);
        if (isMounted) {
          setTransactions(res.data?.transactions ?? []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error fetching transactions:', err);
          const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
          setError(
            apiErr.response?.data?.message || apiErr.message || 'Erro ao carregar transações.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [query]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
