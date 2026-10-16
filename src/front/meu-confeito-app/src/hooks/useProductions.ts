import { useCallback, useEffect, useState } from 'react';

import { OfflineOperationsService } from '../services/offlineOperations';
import { ProductionService } from '../services/production';
import {
  ProductionItem,
  ProductionQueryParams,
  RegisterProductionInput,
} from '../types/production';
import { Storage } from '../utils/storage';

export function useProductions(initialParams?: ProductionQueryParams, isEnabled: boolean = true) {
  const [productions, setProductions] = useState<ProductionItem[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductions = useCallback(
    async (params?: ProductionQueryParams) => {
      if (!isEnabled) {
        setIsLoading(false);
        return;
      }

      const token = Storage.getFastItem('access_token') || (await Storage.getItem('access_token'));
      if (!token) {
        setIsLoading(false);
        return;
      }

      const resolvedParams = params ?? initialParams;

      try {
        setIsLoading(true);
        setError(null);
        const res = await ProductionService.list(resolvedParams);
        const fetchedProductions = res.data.productions ?? [];
        setProductions(fetchedProductions);
        setIsOffline(false);

        // Auto-save to offline cache in background with intelligent pruning
        OfflineOperationsService.saveProductions(fetchedProductions).catch((err) =>
          console.warn('Failed to auto-save productions offline:', err),
        );
      } catch (err) {
        const cached = await OfflineOperationsService.getProductions(resolvedParams);
        if (cached.length > 0) {
          setProductions(cached);
          setIsOffline(true);
          setError(null);
        } else {
          console.error('Error fetching productions: ', err);
          setError('Erro ao carregar produções.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [initialParams, isEnabled],
  );

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
      const fastCached = OfflineOperationsService.getProductionsFast(initialParams);
      if (fastCached && fastCached.length > 0 && isMounted) {
        setProductions(fastCached);
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
        const res = await ProductionService.list(initialParams);
        const fetchedProductions = res.data.productions ?? [];
        if (isMounted) {
          setProductions(fetchedProductions);
          setIsOffline(false);
        }

        OfflineOperationsService.saveProductions(fetchedProductions).catch((err) =>
          console.warn('Failed to auto-save productions offline:', err),
        );
      } catch (err) {
        const cached = await OfflineOperationsService.getProductions(initialParams);
        if (isMounted) {
          if (cached.length > 0) {
            setProductions(cached);
            setIsOffline(true);
            setError(null);
          } else {
            console.error('Error fetching productions: ', err);
            setError('Erro ao carregar produções.');
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
  }, [initialParams, isEnabled]);

  const cancelProduction = async (id: string) => {
    try {
      const res = await ProductionService.cancel(id);
      const updatedList = productions.map((item) => (item.id === id ? res.data.production : item));
      setProductions(updatedList);
      OfflineOperationsService.saveProductions(updatedList).catch((err) =>
        console.warn('Failed to update offline productions after cancel:', err),
      );
      return res.data.production;
    } catch (err) {
      console.error('Error canceling production: ', err);
      throw err;
    }
  };

  return {
    productions,
    isLoading,
    isOffline,
    error,
    refetch: fetchProductions,
    cancelProduction,
  };
}

export function useRegisterProduction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerProduction = async (data: RegisterProductionInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ProductionService.register(data);
      return res;
    } catch (err) {
      console.error('Error registering production: ', err);
      setError('Erro ao registrar produção.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { registerProduction, isLoading, error };
}

export function useSingleProduction(id: string) {
  const [production, setProduction] = useState<ProductionItem | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduction = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await ProductionService.getSingle(id);
      setProduction(res.data.production);
      setIsOffline(false);
    } catch (err) {
      const cached = await OfflineOperationsService.getSingleProduction(id);
      if (cached) {
        setProduction(cached);
        setIsOffline(true);
        setError(null);
      } else {
        console.error('Error fetching single production: ', err);
        setError('Erro ao carregar detalhes da produção.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    if (!id) return;

    async function load() {
      // Preload from cached list if available
      const fastCached = OfflineOperationsService.getProductionsFast({ includeCanceled: true });
      const foundFast = fastCached?.find((p) => p.id === id);
      if (foundFast && isMounted) {
        setProduction(foundFast);
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await ProductionService.getSingle(id);
        if (isMounted) {
          setProduction(res.data.production);
          setIsOffline(false);
        }
      } catch (err) {
        const cached = await OfflineOperationsService.getSingleProduction(id);
        if (isMounted) {
          if (cached) {
            setProduction(cached);
            setIsOffline(true);
            setError(null);
          } else {
            console.error('Error fetching single production: ', err);
            setError('Erro ao carregar detalhes da produção.');
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
  }, [id]);

  return { production, isLoading, isOffline, error, refetch: fetchProduction };
}
