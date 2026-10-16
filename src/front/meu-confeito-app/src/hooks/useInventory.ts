import { useCallback, useEffect, useState } from 'react';

import { InventoryService } from '../services/inventory';
import { OfflineOperationsService } from '../services/offlineOperations';
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
import { Storage } from '../utils/storage';

export function useInventory(isEnabled: boolean = true) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    const token = Storage.getFastItem('access_token') || (await Storage.getItem('access_token'));
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await InventoryService.list();
      const remoteItems = res.data?.inventory ?? [];
      setInventory(remoteItems);
      setIsOffline(false);
      OfflineOperationsService.saveInventory(remoteItems).catch((err) =>
        console.warn('Failed to auto-save inventory offline:', err),
      );
    } catch (err: unknown) {
      const cached = await OfflineOperationsService.getInventory();
      if (cached.length > 0) {
        setInventory(cached);
        setIsOffline(true);
        setError(null);
      } else {
        console.error('Error fetching inventory:', err);
        const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
        setError(apiErr.response?.data?.message || apiErr.message || 'Erro ao carregar estoque.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!isEnabled) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      // Preload from fast cache to avoid UI flickers
      const fastCached = OfflineOperationsService.getInventoryFast();
      if (fastCached && fastCached.length > 0 && isMounted) {
        setInventory(fastCached);
      }

      const token = Storage.getFastItem('access_token') || (await Storage.getItem('access_token'));
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await InventoryService.list();
        const remoteItems = res.data?.inventory ?? [];
        if (isMounted) {
          setInventory(remoteItems);
          setIsOffline(false);
        }
        OfflineOperationsService.saveInventory(remoteItems).catch((err) =>
          console.warn('Failed to auto-save inventory offline:', err),
        );
      } catch (err: unknown) {
        const cached = await OfflineOperationsService.getInventory();
        if (isMounted) {
          if (cached.length > 0) {
            setInventory(cached);
            setIsOffline(true);
            setError(null);
          } else {
            console.error('Error fetching inventory:', err);
            const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
            setError(
              apiErr.response?.data?.message || apiErr.message || 'Erro ao carregar estoque.',
            );
          }
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
  }, [isEnabled]);

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
    isOffline,
    error,
    refetch: fetchInventory,
    registerPurchase,
    registerAdjustment,
    registerWaste,
    setInventory,
  };
}

export function useInventoryTransactions(
  query?: TransactionQueryRequest,
  isEnabled: boolean = true,
) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    const token = Storage.getFastItem('access_token') || (await Storage.getItem('access_token'));
    if (!token) {
      setIsLoading(false);
      return;
    }

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
  }, [query, isEnabled]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!isEnabled) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      const token = Storage.getFastItem('access_token') || (await Storage.getItem('access_token'));
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

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
  }, [query, isEnabled]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
