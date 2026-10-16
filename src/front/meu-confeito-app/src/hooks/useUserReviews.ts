import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { NetworkService } from '../services/network';
import { OfflineCacheService } from '../services/offlineCache';
import { RecipeService } from '../services/recipe';
import { UserService } from '../services/user';
import { UserReviewItem } from '../types/review';

export function useUserReviews(userId: string | undefined) {
  const [userReviews, setUserReviews] = useState<UserReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(userId));
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserReviews = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await UserService.getUserReviews(userId);
      const reviews = res.data?.reviews || [];
      setUserReviews(reviews);
      setIsOffline(false);
      OfflineCacheService.saveUserReviews(reviews).catch(() => {});
    } catch (err: unknown) {
      const cached = await OfflineCacheService.getUserReviews();
      if (cached.length > 0) {
        setUserReviews(cached);
        setIsOffline(true);
        setError(null);
      } else {
        console.error('Error fetching user reviews: ', err);
        setError('Erro ao carregar suas avaliações.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      return;
    }

    async function load() {
      // Preload fast cache to render instantly
      const fastCached = OfflineCacheService.getUserReviewsFast();
      if (fastCached && fastCached.length > 0 && isMounted) {
        setUserReviews(fastCached);
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await UserService.getUserReviews(userId!);
        const reviews = res.data?.reviews || [];
        if (isMounted) {
          setUserReviews(reviews);
          setIsOffline(false);
        }
        OfflineCacheService.saveUserReviews(reviews).catch(() => {});
      } catch (err: unknown) {
        const cached = await OfflineCacheService.getUserReviews();
        if (isMounted) {
          if (cached.length > 0) {
            setUserReviews(cached);
            setIsOffline(true);
            setError(null);
          } else {
            console.error('Error fetching user reviews: ', err);
            setError('Erro ao carregar suas avaliações.');
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
  }, [userId]);

  const deleteReview = useCallback(
    async (recipeId: string): Promise<boolean> => {
      if (NetworkService.getIsOffline()) {
        Alert.alert('Modo Offline', 'Excluir avaliações requer conexão com a internet.');
        return false;
      }

      setIsDeletingId(recipeId);
      try {
        await RecipeService.deleteReview(recipeId);
        const updated = userReviews.filter((item) => item.recipeId !== recipeId);
        setUserReviews(updated);
        OfflineCacheService.saveUserReviews(updated).catch(() => {});
        return true;
      } catch (err: unknown) {
        const apiErr = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const message =
          apiErr?.response?.data?.message || apiErr?.message || 'Erro ao remover avaliação.';
        Alert.alert('Erro ao Remover', message);
        return false;
      } finally {
        setIsDeletingId(null);
      }
    },
    [userReviews],
  );

  return {
    userReviews,
    isLoading,
    isDeletingId,
    isOffline,
    error,
    deleteReview,
    refetch: fetchUserReviews,
  };
}
