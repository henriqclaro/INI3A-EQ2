import { useCallback, useEffect, useState } from 'react';

import { OfflineOperationsService, OperationsStorageStats } from '../services/offlineOperations';

export function useOfflineOperations() {
  const [stats, setStats] = useState<OperationsStorageStats>({
    inventoryCount: 0,
    productionsCount: 0,
    summariesCount: 0,
    estimatedBytes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const currentStats = await OfflineOperationsService.getOperationsStorageStats();
      setStats(currentStats);
    } catch (err) {
      console.warn('Failed to fetch offline operations storage stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const initialStats = await OfflineOperationsService.getOperationsStorageStats();
        if (isMounted) {
          setStats(initialStats);
        }
      } catch (err) {
        console.warn('Failed to load initial offline operations stats:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    const unsubscribe = OfflineOperationsService.subscribe(() => {
      if (isMounted) {
        fetchStats();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [fetchStats]);

  const clearAll = useCallback(async () => {
    const res = await OfflineOperationsService.clearAllOperationsData();
    if (res.isSuccess) {
      await fetchStats();
    }
    return res;
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    clearAll,
    refetch: fetchStats,
  };
}
