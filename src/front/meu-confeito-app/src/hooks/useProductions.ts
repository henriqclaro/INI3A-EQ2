import { useCallback, useEffect, useState } from 'react';

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

      try {
        setIsLoading(true);
        setError(null);
        const resolvedParams = params ?? initialParams;
        const res = await ProductionService.list(resolvedParams);
        setProductions(res.data.productions);
      } catch (err) {
        console.error('Error fetching productions: ', err);
        setError('Erro ao carregar produções.');
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
        if (isMounted) {
          setProductions(res.data.productions);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching productions: ', err);
          setError('Erro ao carregar produções.');
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
      setProductions((prev) => prev.map((item) => (item.id === id ? res.data.production : item)));
      return res.data.production;
    } catch (err) {
      console.error('Error canceling production: ', err);
      throw err;
    }
  };

  return {
    productions,
    isLoading,
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
    } catch (err) {
      console.error('Error fetching single production: ', err);
      setError('Erro ao carregar detalhes da produção.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    if (!id) return;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await ProductionService.getSingle(id);
        if (isMounted) {
          setProduction(res.data.production);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching single production: ', err);
          setError('Erro ao carregar detalhes da produção.');
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

  return { production, isLoading, error, refetch: fetchProduction };
}
