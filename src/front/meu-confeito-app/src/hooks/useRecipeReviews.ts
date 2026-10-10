import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { RecipeService } from '../services/recipe';
import { RatingCounts, RecipeReviewItem, RecipeReviewsData } from '../types/review';

const defaultRatingCounts: RatingCounts = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

interface UseRecipeReviewsOptions {
  recipeId: string;
  currentUserId?: string;
  initialUserReview?: RecipeReviewItem | null;
  initialTotalReviews?: number;
  initialAverageRating?: number | string;
  initialRatingCounts?: RatingCounts;
}

export function useRecipeReviews({
  recipeId,
  currentUserId,
  initialUserReview = null,
  initialTotalReviews = 0,
  initialAverageRating = 0,
  initialRatingCounts = defaultRatingCounts,
}: UseRecipeReviewsOptions) {
  const [fetchedData, setFetchedData] = useState<RecipeReviewsData | null>(null);
  const [localUserReview, setLocalUserReview] = useState<RecipeReviewItem | null | undefined>(
    undefined,
  );
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(Boolean(recipeId));
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [isDeletingReview, setIsDeletingReview] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reviews = fetchedData?.reviews ?? [];
  const totalReviews = fetchedData ? fetchedData.totalReviews : initialTotalReviews;
  const averageRating = fetchedData ? fetchedData.averageRating : initialAverageRating;
  const ratingCounts = fetchedData
    ? fetchedData.ratingCounts
    : initialRatingCounts || defaultRatingCounts;

  const userReviewFromApi = useMemo(() => {
    if (!currentUserId || !fetchedData?.reviews) return null;
    return fetchedData.reviews.find((r) => r.userId === currentUserId) ?? null;
  }, [currentUserId, fetchedData]);

  const userReview =
    localUserReview !== undefined ? localUserReview : (userReviewFromApi ?? initialUserReview);

  const fetchReviews = useCallback(async () => {
    if (!recipeId) {
      setIsLoadingReviews(false);
      return;
    }

    try {
      setIsLoadingReviews(true);
      setError(null);
      const res = await RecipeService.getReviews(recipeId);
      setFetchedData(res.data);
    } catch (err: unknown) {
      console.error('Error fetching recipe reviews: ', err);
      setError('Erro ao carregar avaliações.');
    } finally {
      setIsLoadingReviews(false);
    }
  }, [recipeId]);

  useEffect(() => {
    let isMounted = true;

    if (!recipeId) {
      return;
    }

    async function load() {
      try {
        setIsLoadingReviews(true);
        setError(null);
        const res = await RecipeService.getReviews(recipeId);
        if (isMounted) {
          setFetchedData(res.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error fetching recipe reviews: ', err);
          setError('Erro ao carregar avaliações.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingReviews(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  const createReview = useCallback(
    async (rating: number): Promise<boolean> => {
      if (!recipeId) return false;

      setIsSubmittingReview(true);
      try {
        const res = await RecipeService.createReview(recipeId, rating);
        setLocalUserReview(res.data.review);
        await fetchReviews();
        return true;
      } catch (err: unknown) {
        const apiErr = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const message =
          apiErr?.response?.data?.message || apiErr?.message || 'Erro ao registrar avaliação.';
        Alert.alert('Erro ao Avaliar', message);
        return false;
      } finally {
        setIsSubmittingReview(false);
      }
    },
    [recipeId, fetchReviews],
  );

  const updateReview = useCallback(
    async (rating: number): Promise<boolean> => {
      if (!recipeId) return false;

      setIsSubmittingReview(true);
      try {
        const res = await RecipeService.updateReview(recipeId, rating);
        setLocalUserReview(res.data.review);
        await fetchReviews();
        return true;
      } catch (err: unknown) {
        const apiErr = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        const message =
          apiErr?.response?.data?.message || apiErr?.message || 'Erro ao atualizar avaliação.';
        Alert.alert('Erro ao Atualizar', message);
        return false;
      } finally {
        setIsSubmittingReview(false);
      }
    },
    [recipeId, fetchReviews],
  );

  const deleteReview = useCallback(async (): Promise<boolean> => {
    if (!recipeId) return false;

    setIsDeletingReview(true);
    try {
      await RecipeService.deleteReview(recipeId);
      setLocalUserReview(null);
      await fetchReviews();
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
      setIsDeletingReview(false);
    }
  }, [recipeId, fetchReviews]);

  return {
    reviews,
    totalReviews,
    averageRating,
    ratingCounts,
    userReview,
    isLoadingReviews,
    isSubmittingReview,
    isDeletingReview,
    error,
    createReview,
    updateReview,
    deleteReview,
    refetchReviews: fetchReviews,
  };
}
