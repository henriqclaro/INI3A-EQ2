import { useCallback, useEffect, useState } from 'react';

import { DownloadedRecipeService } from '../services/downloadedRecipes';
import { NetworkService } from '../services/network';
import { OfflineCacheService } from '../services/offlineCache';
import { RecipeService } from '../services/recipe';
import { UserService } from '../services/user';
import { PartialRecipe } from '../types';
import {
  FullRecipe,
  RecipeRegisterInput,
  RecipeStatus,
  RecipeUpdateInput,
  UpdateRecipeVisibilityInput,
} from '../types/recipe';

export interface UseManyRecipesOptions {
  search?: string;
  page?: number;
  sort?: string;
  dateLimit?: number;
  enabled?: boolean;
}

export function useManyRecipes(
  searchOrOptions?: string | UseManyRecipesOptions,
  pageParam?: number,
  sortParam?: string,
  dateLimitParam?: number,
) {
  const isEnabled = typeof searchOrOptions === 'object' ? (searchOrOptions.enabled ?? true) : true;
  const search = typeof searchOrOptions === 'object' ? searchOrOptions.search : searchOrOptions;
  const initialPage = (typeof searchOrOptions === 'object' ? searchOrOptions.page : pageParam) ?? 0;
  const sort = typeof searchOrOptions === 'object' ? searchOrOptions.sort : sortParam;
  const dateLimit =
    typeof searchOrOptions === 'object' ? searchOrOptions.dateLimit : dateLimitParam;

  const [recipes, setRecipes] = useState<PartialRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(isEnabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(
    async (pageToFetch: number = 0, isAppend: boolean = false) => {
      if (!isEnabled) {
        setIsLoading(false);
        return;
      }
      try {
        if (isAppend) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);
        const res = await RecipeService.search({
          search,
          page: pageToFetch,
          sort,
          dateLimit,
        });
        const newRecipes = res.data?.recipes ?? [];
        if (isAppend) {
          setRecipes((prev) => [...prev, ...newRecipes]);
        } else {
          setRecipes(newRecipes);
          if (!search && pageToFetch === 0) {
            OfflineCacheService.savePublicRecipes(newRecipes).catch(() => {});
          }
        }
        setIsOffline(false);
        setCurrentPage(pageToFetch);
        setHasMore(newRecipes.length >= 10);
      } catch (err) {
        if (!search && pageToFetch === 0) {
          const cached = await OfflineCacheService.getPublicRecipes();
          if (cached.length > 0) {
            setRecipes(cached);
            setIsOffline(true);
            setError(null);
            return;
          }
        }
        console.error('Error fetching Recipes: ', err);
        setError('Error searching recipes.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isEnabled, search, sort, dateLimit],
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!isEnabled) {
        setIsLoading(false);
        return;
      }

      if (!search && initialPage === 0) {
        const fastCached = OfflineCacheService.getPublicRecipesFast();
        if (fastCached && fastCached.length > 0 && isMounted) {
          setRecipes(fastCached);
        }
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await RecipeService.search({
          search,
          page: initialPage,
          sort,
          dateLimit,
        });
        const newRecipes = res.data?.recipes ?? [];
        if (isMounted) {
          setRecipes(newRecipes);
          setIsOffline(false);
          setCurrentPage(initialPage);
          setHasMore(newRecipes.length >= 10);
        }
        if (!search && initialPage === 0) {
          OfflineCacheService.savePublicRecipes(newRecipes).catch(() => {});
        }
      } catch (err) {
        if (!search && initialPage === 0) {
          const cached = await OfflineCacheService.getPublicRecipes();
          if (isMounted && cached.length > 0) {
            setRecipes(cached);
            setIsOffline(true);
            setError(null);
            return;
          }
        }
        if (isMounted) {
          console.error('Error fetching Recipes: ', err);
          setError('Error searching recipes.');
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
  }, [isEnabled, search, sort, dateLimit, initialPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) {
      return;
    }
    await fetchRecipes(currentPage + 1, true);
  }, [hasMore, isLoading, isLoadingMore, fetchRecipes, currentPage]);

  const refetch = useCallback(async () => {
    setCurrentPage(initialPage);
    setHasMore(true);
    await fetchRecipes(initialPage, false);
  }, [fetchRecipes, initialPage]);

  return {
    recipes,
    isLoading,
    isLoadingMore,
    isOffline,
    hasMore,
    error,
    refetch,
    loadMore,
    page: currentPage,
  };
}

export function useSingleRecipe(recipeId: string, userId?: string) {
  const [recipe, setRecipe] = useState<FullRecipe>();
  const [isLoading, setIsLoading] = useState(Boolean(recipeId));
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const fetchRecipe = useCallback(async () => {
    if (!recipeId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = userId
        ? await RecipeService.getRecipeWithUserInventory(recipeId, userId)
        : await RecipeService.getRecipe(recipeId);

      setRecipe(res.data.recipe);
      setIsOffline(false);

      if (res.data.recipe.userId && userId && res.data.recipe.userId === userId) {
        DownloadedRecipeService.updateDownloadedRecipeIfSaved(res.data.recipe, true).catch(
          () => {},
        );
      }
    } catch (err) {
      const downloaded = await DownloadedRecipeService.getDownloadedRecipe(recipeId);
      if (downloaded) {
        setRecipe(downloaded.recipe);
        setIsOffline(true);
        setError(null);
      } else {
        console.error('Error fetching recipe: ', err);
        setError('Error fetching recipe.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [recipeId, userId]);

  useEffect(() => {
    let isMounted = true;

    if (!recipeId) {
      return;
    }

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = userId
          ? await RecipeService.getRecipeWithUserInventory(recipeId, userId)
          : await RecipeService.getRecipe(recipeId);

        if (isMounted) {
          setRecipe(res.data.recipe);
          setIsOffline(false);

          if (res.data.recipe.userId && userId && res.data.recipe.userId === userId) {
            DownloadedRecipeService.updateDownloadedRecipeIfSaved(res.data.recipe, true).catch(
              () => {},
            );
          }
        }
      } catch (err) {
        const downloaded = await DownloadedRecipeService.getDownloadedRecipe(recipeId);
        if (isMounted) {
          if (downloaded) {
            setRecipe(downloaded.recipe);
            setIsOffline(true);
            setError(null);
          } else {
            console.error('Error fetching recipe: ', err);
            setError('Error fetching recipe.');
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
  }, [recipeId, userId]);

  const updateVisibility = async (status: RecipeStatus) => {
    if (!userId) {
      throw new Error('User ID is required to update recipe visibility');
    }
    setIsUpdatingVisibility(true);
    try {
      const res = await RecipeService.updateVisibility(recipeId, {
        userId,
        status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
      });
      setRecipe((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, status: res.data.recipe.status };
        DownloadedRecipeService.updateDownloadedRecipeIfSaved(updated, true).catch(() => {});
        return updated;
      });
      return res;
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  return {
    recipe,
    isLoading,
    isOffline,
    error,
    refetch: fetchRecipe,
    updateVisibility,
    isUpdatingVisibility,
  };
}

export function useUserRecipes(
  userId: string | undefined,
  status?: RecipeStatus,
  initialPage: number = 0,
) {
  const isArchived = status === 'ARCHIVED';
  const [recipes, setRecipes] = useState<PartialRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRecipes = useCallback(
    async (pageToFetch: number = 0, isAppend: boolean = false) => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        if (isAppend) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);
        const res = await UserService.getRecipes(userId, status, pageToFetch);
        const newRecipes = res.data?.recipes ?? [];
        if (isAppend) {
          setRecipes((prev) => [...prev, ...newRecipes]);
        } else {
          setRecipes(newRecipes);
          if (pageToFetch === 0) {
            if (isArchived) {
              OfflineCacheService.saveArchivedRecipes(newRecipes).catch(() => {});
            } else {
              OfflineCacheService.saveUserRecipes(newRecipes).catch(() => {});
            }
          }
        }
        setIsOffline(false);
        setCurrentPage(pageToFetch);
        setHasMore(newRecipes.length >= 10);
      } catch (err) {
        if (pageToFetch === 0) {
          const cached = isArchived
            ? await OfflineCacheService.getArchivedRecipes()
            : await OfflineCacheService.getUserRecipes();
          if (cached.length > 0) {
            setRecipes(cached);
            setIsOffline(true);
            setError(null);
            return;
          }
        }
        console.error('Error fetching User Recipes: ', err);
        setError('Error fetching recipes.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userId, status, isArchived],
  );

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      return;
    }

    async function load() {
      if (initialPage === 0) {
        const fastCached = isArchived
          ? OfflineCacheService.getArchivedRecipesFast()
          : OfflineCacheService.getUserRecipesFast();
        if (fastCached && fastCached.length > 0 && isMounted) {
          setRecipes(fastCached);
        }
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await UserService.getRecipes(userId!, status, initialPage);
        const newRecipes = res.data?.recipes ?? [];
        if (isMounted) {
          setRecipes(newRecipes);
          setIsOffline(false);
          setCurrentPage(initialPage);
          setHasMore(newRecipes.length >= 10);
        }
        if (initialPage === 0) {
          if (isArchived) {
            OfflineCacheService.saveArchivedRecipes(newRecipes).catch(() => {});
          } else {
            OfflineCacheService.saveUserRecipes(newRecipes).catch(() => {});
          }
        }
      } catch (err) {
        if (initialPage === 0) {
          const cached = isArchived
            ? await OfflineCacheService.getArchivedRecipes()
            : await OfflineCacheService.getUserRecipes();
          if (isMounted && cached.length > 0) {
            setRecipes(cached);
            setIsOffline(true);
            setError(null);
            return;
          }
        }
        if (isMounted) {
          console.error('Error fetching User Recipes: ', err);
          setError('Error fetching recipes.');
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
  }, [userId, status, initialPage, isArchived]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore || !userId) {
      return;
    }
    await fetchUserRecipes(currentPage + 1, true);
  }, [hasMore, isLoading, isLoadingMore, userId, fetchUserRecipes, currentPage]);

  const refetch = useCallback(async () => {
    setCurrentPage(initialPage);
    setHasMore(true);
    await fetchUserRecipes(initialPage, false);
  }, [fetchUserRecipes, initialPage]);

  return {
    recipes,
    isLoading,
    isLoadingMore,
    isOffline,
    hasMore,
    error,
    refetch,
    loadMore,
    page: currentPage,
  };
}

export function useRecipeRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerRecipe = async (data: RecipeRegisterInput) => {
    if (NetworkService.getIsOffline()) {
      const msg = 'Operação indisponível offline. Conecte-se à internet para cadastrar a receita.';
      setError(msg);
      throw new Error(msg);
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await RecipeService.register(data);
      return response;
    } catch (err) {
      console.error('Error during recipe registration: ', err);
      setError('Erro ao cadastrar receita.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { registerRecipe, isLoading, error };
}

export function useRecipeVisibility() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVisibility = async (recipeId: string, data: UpdateRecipeVisibilityInput) => {
    if (NetworkService.getIsOffline()) {
      const msg =
        'Operação indisponível offline. Conecte-se à internet para alterar a visibilidade da receita.';
      setError(msg);
      throw new Error(msg);
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await RecipeService.updateVisibility(recipeId, data);
      return response;
    } catch (err) {
      console.error('Error updating recipe visibility: ', err);
      setError('Erro ao atualizar visibilidade da receita.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateVisibility, isLoading, error };
}

export function useRecipeUpdate() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRecipe = async (recipeId: string, data: RecipeUpdateInput) => {
    if (NetworkService.getIsOffline()) {
      const msg = 'Operação indisponível offline. Conecte-se à internet para atualizar a receita.';
      setError(msg);
      throw new Error(msg);
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await RecipeService.update(recipeId, data);
      if (response.data?.recipe) {
        await DownloadedRecipeService.updateDownloadedRecipeIfSaved(
          response.data.recipe as unknown as FullRecipe,
          true,
        );
      }
      return response;
    } catch (err) {
      console.error('Error during recipe update: ', err);
      setError('Erro ao atualizar receita.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateRecipe, isLoading, error };
}

export function useRecipeDelete() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRecipe = async (recipeId: string) => {
    if (NetworkService.getIsOffline()) {
      const msg = 'Operação indisponível offline. Conecte-se à internet para excluir a receita.';
      setError(msg);
      throw new Error(msg);
    }

    setIsLoading(true);
    setError(null);
    try {
      await RecipeService.delete(recipeId);
      await DownloadedRecipeService.removeDownloadedRecipe(recipeId);
    } catch (err: unknown) {
      console.error('Error deleting recipe:', err);
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      const apiMessage =
        apiErr?.response?.data?.message || apiErr?.message || 'Erro ao excluir receita.';
      setError(apiMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteRecipe, isLoading, error };
}
