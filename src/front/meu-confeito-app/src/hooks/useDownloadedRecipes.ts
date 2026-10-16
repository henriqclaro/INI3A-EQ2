import { useCallback, useEffect, useState } from 'react';

import { DownloadedRecipeService } from '../services/downloadedRecipes';
import {
  ClearDownloadedRecipesResult,
  DownloadedRecipe,
  FullRecipe,
  PartialRecipe,
} from '../types';

export function useDownloadedRecipe(
  recipe?: FullRecipe | PartialRecipe | null,
  isOwner: boolean = false,
) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedRecipe, setDownloadedRecipe] = useState<DownloadedRecipe | null>(null);

  const recipeId = recipe?.id;
  const recipeUpdatedAt = recipe?.updatedAt;

  const checkStatus = useCallback(async () => {
    if (!recipeId) {
      setIsDownloaded(false);
      setHasUpdate(false);
      setDownloadedRecipe(null);
      return;
    }

    try {
      const stored = await DownloadedRecipeService.getDownloadedRecipe(recipeId);
      if (stored) {
        setIsDownloaded(true);
        setDownloadedRecipe(stored);

        const hasAvailableUpdate = await DownloadedRecipeService.hasDownloadedRecipeUpdate(
          recipeId,
          recipeUpdatedAt,
          recipe,
        );
        setHasUpdate(hasAvailableUpdate);
      } else {
        setIsDownloaded(false);
        setHasUpdate(false);
        setDownloadedRecipe(null);
      }
    } catch (err) {
      console.warn('Error checking downloaded recipe status:', err);
    }
  }, [recipeId, recipeUpdatedAt, recipe]);

  useEffect(() => {
    let isMounted = true;

    async function syncStatus() {
      if (!recipeId) {
        if (isMounted) {
          setIsDownloaded(false);
          setHasUpdate(false);
          setDownloadedRecipe(null);
        }
        return;
      }

      try {
        const stored = await DownloadedRecipeService.getDownloadedRecipe(recipeId);
        if (!isMounted) return;

        if (stored) {
          setIsDownloaded(true);
          setDownloadedRecipe(stored);

          const hasAvailableUpdate = await DownloadedRecipeService.hasDownloadedRecipeUpdate(
            recipeId,
            recipeUpdatedAt,
            recipe,
          );
          if (isMounted) {
            setHasUpdate(hasAvailableUpdate);
          }
        } else {
          setIsDownloaded(false);
          setHasUpdate(false);
          setDownloadedRecipe(null);
        }
      } catch (err) {
        console.warn('Error checking downloaded recipe status:', err);
      }
    }

    void syncStatus();

    const unsubscribe = DownloadedRecipeService.subscribe(() => {
      void syncStatus();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [recipeId, recipeUpdatedAt, recipe]);

  const downloadRecipe = useCallback(async (): Promise<boolean> => {
    if (!recipe || !recipe.id) return false;
    setIsLoading(true);
    try {
      await DownloadedRecipeService.saveDownloadedRecipe(recipe as FullRecipe, isOwner);
      await checkStatus();
      return true;
    } catch (err) {
      console.error('Error downloading recipe:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [recipe, isOwner, checkStatus]);

  const updateRecipe = useCallback(async (): Promise<boolean> => {
    if (!recipe || !recipe.id) return false;
    setIsLoading(true);
    try {
      await DownloadedRecipeService.saveDownloadedRecipe(recipe as FullRecipe, isOwner);
      await checkStatus();
      return true;
    } catch (err) {
      console.error('Error updating downloaded recipe:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [recipe, isOwner, checkStatus]);

  const removeRecipe = useCallback(async (): Promise<boolean> => {
    if (!recipeId) return false;
    setIsLoading(true);
    try {
      const isRemoved = await DownloadedRecipeService.removeDownloadedRecipe(recipeId);
      await checkStatus();
      return isRemoved;
    } catch (err) {
      console.error('Error removing downloaded recipe:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [recipeId, checkStatus]);

  return {
    isDownloaded,
    hasUpdate,
    isLoading,
    downloadedRecipe,
    downloadRecipe,
    updateRecipe,
    removeRecipe,
    refetch: checkStatus,
  };
}

export function useAllDownloadedRecipes() {
  const [downloadedRecipes, setDownloadedRecipes] = useState<DownloadedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await DownloadedRecipeService.getAllDownloadedRecipes();
      setDownloadedRecipes(list);
    } catch (err) {
      console.warn('Error fetching all downloaded recipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAll() {
      try {
        const list = await DownloadedRecipeService.getAllDownloadedRecipes();
        if (isMounted) {
          setDownloadedRecipes(list);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching all downloaded recipes:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAll();

    const unsubscribe = DownloadedRecipeService.subscribe(() => {
      void loadAll();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const clearAll = useCallback(async (): Promise<ClearDownloadedRecipesResult> => {
    setIsLoading(true);
    try {
      const result = await DownloadedRecipeService.clearAllDownloadedRecipes();
      await fetchAll();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  const removeRecipe = useCallback(
    async (recipeId: string): Promise<boolean> => {
      try {
        const isRemoved = await DownloadedRecipeService.removeDownloadedRecipe(recipeId);
        await fetchAll();
        return isRemoved;
      } catch (err) {
        console.warn('Error removing recipe from downloaded collection:', err);
        return false;
      }
    },
    [fetchAll],
  );

  return {
    downloadedRecipes,
    isLoading,
    count: downloadedRecipes.length,
    refetch: fetchAll,
    clearAll,
    removeRecipe,
  };
}
