import { useCallback, useEffect, useState } from 'react';

import { AnalyticsService } from '../services/analytics';
import {
  PlannedProductionItem,
  ProfitSummaryData,
  PurchaseProjectionData,
} from '../types/analytics';
import { Storage } from '../utils/storage';

export type AnalyticsPeriodPreset = '7d' | '15d' | '30d' | 'month';

export const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDatesForPreset = (
  preset: AnalyticsPeriodPreset,
): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '15d':
      start.setDate(end.getDate() - 15);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case 'month':
      start.setDate(1);
      break;
  }

  return {
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
  };
};

export function useProfitSummary(
  initialPreset: AnalyticsPeriodPreset = '30d',
  isEnabled: boolean = true,
) {
  const [activePreset, setActivePreset] = useState<AnalyticsPeriodPreset>(initialPreset);
  const [dateRange, setDateRange] = useState(getDatesForPreset(initialPreset));
  const [summary, setSummary] = useState<ProfitSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isEnabled);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSummary = useCallback(
    async (range: { startDate: string; endDate: string }) => {
      if (!isEnabled) {
        setIsLoading(false);
        return;
      }

      const token = Storage.getFastItem('access_token') || (await Storage.getItem('access_token'));
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);

      try {
        const response = await AnalyticsService.getProfitSummary({
          startDate: range.startDate,
          endDate: range.endDate,
        });
        setSummary(response.data.summary);
      } catch (err: unknown) {
        setHasError(true);
        const apiErr = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const msg =
          apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível carregar o demonstrativo de lucros.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [isEnabled],
  );

  const changePreset = useCallback(
    (preset: AnalyticsPeriodPreset) => {
      setActivePreset(preset);
      const newRange = getDatesForPreset(preset);
      setDateRange(newRange);
      fetchSummary(newRange);
    },
    [fetchSummary],
  );

  const setCustomRange = useCallback(
    (start: string, end: string) => {
      const newRange = { startDate: start, endDate: end };
      setDateRange(newRange);
      fetchSummary(newRange);
    },
    [fetchSummary],
  );

  const refetch = useCallback(() => {
    return fetchSummary(dateRange);
  }, [fetchSummary, dateRange]);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
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

      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);

      try {
        const response = await AnalyticsService.getProfitSummary({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        if (isMounted) {
          setSummary(response.data.summary);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setHasError(true);
          const apiErr = err as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          setErrorMessage(
            apiErr?.response?.data?.message ||
              apiErr?.message ||
              'Não foi possível carregar o demonstrativo de lucros.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, [dateRange.startDate, dateRange.endDate, isEnabled]);

  return {
    summary,
    isLoading,
    hasError,
    errorMessage,
    activePreset,
    dateRange,
    changePreset,
    setCustomRange,
    refetch,
  };
}

export function usePurchaseProjection() {
  const [plannedProductions, setPlannedProductions] = useState<PlannedProductionItem[]>([]);
  const [projection, setProjection] = useState<PurchaseProjectionData | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addPlannedProduction = useCallback((item: PlannedProductionItem) => {
    setPlannedProductions((prev) => {
      const existingIndex = prev.findIndex((p) => p.recipeId === item.recipeId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          targetYield: updated[existingIndex].targetYield + item.targetYield,
        };
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  const updatePlannedProductionYield = useCallback((recipeId: string, targetYield: number) => {
    setPlannedProductions((prev) =>
      prev.map((item) => (item.recipeId === recipeId ? { ...item, targetYield } : item)),
    );
  }, []);

  const removePlannedProduction = useCallback((recipeId: string) => {
    setPlannedProductions((prev) => prev.filter((item) => item.recipeId !== recipeId));
  }, []);

  const clearPlannedProductions = useCallback(() => {
    setPlannedProductions([]);
    setProjection(null);
    setHasError(false);
    setErrorMessage(null);
  }, []);

  const calculateProjection = useCallback(async () => {
    if (plannedProductions.length === 0) {
      setHasError(true);
      setErrorMessage('Adicione ao menos uma receita para calcular a previsão de compras.');
      return;
    }

    setIsCalculating(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      const payload = {
        plannedProductions: plannedProductions.map((p) => ({
          recipeId: p.recipeId,
          targetYield: p.targetYield,
        })),
      };

      const response = await AnalyticsService.projectPurchases(payload);
      setProjection(response.data.projection);
    } catch (err: unknown) {
      setHasError(true);
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMessage(
        apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível calcular a projeção de compras.',
      );
    } finally {
      setIsCalculating(false);
    }
  }, [plannedProductions]);

  const resetProjection = useCallback(() => {
    setProjection(null);
  }, []);

  return {
    plannedProductions,
    projection,
    isCalculating,
    hasError,
    errorMessage,
    addPlannedProduction,
    updatePlannedProductionYield,
    removePlannedProduction,
    clearPlannedProductions,
    calculateProjection,
    resetProjection,
  };
}
