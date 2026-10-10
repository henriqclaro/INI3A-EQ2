import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { RecipeService } from '../services/recipe';
import { UserService } from '../services/user';
import { UserReviewItem } from '../types/review';

export function useUserReviews(userId: string | undefined) {
  const [userReviews, setUserReviews] = useState<UserReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(userId));
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
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
      setUserReviews(res.data?.reviews || []);
    } catch (err: unknown) {
      console.error('Error fetching user reviews: ', err);
      setError('Erro ao carregar suas avaliações.');
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
      try {
        setIsLoading(true);
        setError(null);
        const res = await UserService.getUserReviews(userId!);
        if (isMounted) {
          setUserReviews(res.data?.reviews || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error fetching user reviews: ', err);
          setError('Erro ao carregar suas avaliações.');
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

  const deleteReview = useCallback(async (recipeId: string): Promise<boolean> => {
    setIsDeletingId(recipeId);
    try {
      await RecipeService.deleteReview(recipeId);
      setUserReviews((prev) => prev.filter((item) => item.recipeId !== recipeId));
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
  }, []);

  return {
    userReviews,
    isLoading,
    isDeletingId,
    error,
    deleteReview,
    refetch: fetchUserReviews,
  };
}
