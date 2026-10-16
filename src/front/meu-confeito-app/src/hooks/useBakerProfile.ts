import { useCallback, useEffect, useRef, useState } from 'react';

import { BakerProfileService } from '../services/baker-profile';
import { NetworkService } from '../services/network';
import { OfflineCacheService } from '../services/offlineCache';
import {
  BakerProfile,
  BakerProfileRegisterInput,
  BakerProfileUpdateInput,
  NearbyBakerItem,
  NearbyBakersQuery,
  NeighborhoodBakersQuery,
  PublicBakerProfile,
} from '../types/baker-profile';
import { ReorderShowcaseItem, ShowcaseRecipeItem } from '../types/showcase';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export function useMyBakerProfile(isEnabled: boolean = true) {
  const [bakerProfile, setBakerProfile] = useState<BakerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isEnabled);
  const [hasBakerProfile, setHasBakerProfile] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await BakerProfileService.getMyProfile();
      if (response?.data?.bakerProfile) {
        setBakerProfile(response.data.bakerProfile);
        setHasBakerProfile(true);
        setIsOffline(false);
        OfflineCacheService.saveBakerProfile(response.data.bakerProfile).catch(() => {});
      } else {
        setBakerProfile(null);
        setHasBakerProfile(false);
        setIsOffline(false);
        OfflineCacheService.saveBakerProfile(null).catch(() => {});
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      // 404 means the user has not created a baker profile yet (private profile)
      if (apiErr?.response?.status === 404) {
        setBakerProfile(null);
        setHasBakerProfile(false);
      } else {
        const cached = await OfflineCacheService.getBakerProfile();
        if (cached) {
          setBakerProfile(cached);
          setHasBakerProfile(true);
          setIsOffline(true);
          setError(null);
        } else {
          console.error('Error fetching baker profile:', err);
          setError('Não foi possível carregar o perfil de confeiteiro.');
          setBakerProfile(null);
          setHasBakerProfile(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    let isMounted = true;

    if (!isEnabled) {
      return;
    }

    async function load() {
      // Preload fast cache
      const fastCached = OfflineCacheService.getBakerProfileFast();
      if (fastCached && isMounted) {
        setBakerProfile(fastCached);
        setHasBakerProfile(true);
      }

      try {
        const response = await BakerProfileService.getMyProfile();
        if (isMounted) {
          if (response?.data?.bakerProfile) {
            setBakerProfile(response.data.bakerProfile);
            setHasBakerProfile(true);
            setIsOffline(false);
            OfflineCacheService.saveBakerProfile(response.data.bakerProfile).catch(() => {});
          } else {
            setBakerProfile(null);
            setHasBakerProfile(false);
            setIsOffline(false);
            OfflineCacheService.saveBakerProfile(null).catch(() => {});
          }
        }
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        if (isMounted) {
          if (apiErr?.response?.status === 404) {
            setBakerProfile(null);
            setHasBakerProfile(false);
          } else {
            const cached = await OfflineCacheService.getBakerProfile();
            if (cached) {
              setBakerProfile(cached);
              setHasBakerProfile(true);
              setIsOffline(true);
              setError(null);
            } else {
              console.error('Error loading baker profile:', err);
              setError('Não foi possível carregar o perfil de confeiteiro.');
              setBakerProfile(null);
              setHasBakerProfile(false);
            }
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

  return {
    bakerProfile,
    hasBakerProfile,
    isLoading,
    isOffline,
    error,
    refetch: fetchProfile,
    setBakerProfile,
    setHasBakerProfile,
  };
}

export function useSaveBakerProfile() {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const saveBakerProfile = async (
    data: BakerProfileRegisterInput | BakerProfileUpdateInput,
    hasExistingProfile: boolean,
  ) => {
    if (NetworkService.getIsOffline()) {
      const msg = 'Operação indisponível offline. Conecte-se à internet para salvar o perfil.';
      setError(msg);
      throw new Error(msg);
    }

    setIsSaving(true);
    setError(null);
    try {
      if (hasExistingProfile) {
        const response = await BakerProfileService.updateMyProfile(data);
        OfflineCacheService.saveBakerProfile(response.data.bakerProfile).catch(() => {});
        return response.data.bakerProfile;
      } else {
        const response = await BakerProfileService.createMyProfile(data);
        OfflineCacheService.saveBakerProfile(response.data.bakerProfile).catch(() => {});
        return response.data.bakerProfile;
      }
    } catch (err: unknown) {
      console.error('Error saving baker profile:', err);
      const apiErr = err as ApiError;
      const apiMessage =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Erro ao salvar informações do perfil público.';
      setError(apiMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveBakerProfile, isSaving, error };
}

export function useDeleteBakerProfile() {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBakerProfile = async () => {
    if (NetworkService.getIsOffline()) {
      const msg = 'Operação indisponível offline. Conecte-se à internet para excluir o perfil.';
      setError(msg);
      throw new Error(msg);
    }

    setIsDeleting(true);
    setError(null);
    try {
      await BakerProfileService.deleteMyProfile();
      OfflineCacheService.saveBakerProfile(null).catch(() => {});
    } catch (err: unknown) {
      console.error('Error deleting baker profile:', err);
      const apiErr = err as ApiError;
      const apiMessage =
        apiErr?.response?.data?.message || apiErr?.message || 'Erro ao desativar perfil público.';
      setError(apiMessage);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteBakerProfile, isDeleting, error };
}

export function usePublicBakerProfile(userId: string | undefined) {
  const [publicProfile, setPublicProfile] = useState<PublicBakerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(userId));
  const [hasError, setHasError] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPublicProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    try {
      const response = await BakerProfileService.getPublicProfile(userId);
      setPublicProfile(response.data.bakerProfile);
      setIsOffline(false);
    } catch (err: unknown) {
      console.error('Error fetching public baker profile:', err);
      const apiErr = err as ApiError;
      const cached = await OfflineCacheService.getBakerProfile();
      if (cached && (!userId || cached.userId === userId)) {
        setPublicProfile(cached as unknown as PublicBakerProfile);
        setIsOffline(true);
        setHasError(false);
      } else {
        const isOfflineNow = NetworkService.getIsOffline();
        setHasError(true);
        setIsOffline(isOfflineNow);
        setErrorMessage(
          apiErr?.response?.status === 404
            ? 'Perfil de confeiteiro não encontrado ou perfil privado.'
            : isOfflineNow
              ? 'Você está offline. Conecte-se à internet para visualizar perfis de outros confeiteiros.'
              : 'Erro ao carregar o perfil público.',
        );
        setPublicProfile(null);
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
      // Preload fast cache if own profile
      const fastCached = OfflineCacheService.getBakerProfileFast();
      if (fastCached && (!userId || fastCached.userId === userId) && isMounted) {
        setPublicProfile(fastCached as unknown as PublicBakerProfile);
      }

      try {
        const response = await BakerProfileService.getPublicProfile(userId!);
        if (isMounted) {
          setPublicProfile(response.data.bakerProfile);
          setIsOffline(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error loading public baker profile:', err);
          const apiErr = err as ApiError;
          const cached = await OfflineCacheService.getBakerProfile();
          if (cached && (!userId || cached.userId === userId)) {
            setPublicProfile(cached as unknown as PublicBakerProfile);
            setIsOffline(true);
            setHasError(false);
          } else {
            const isOfflineNow = NetworkService.getIsOffline();
            setHasError(true);
            setIsOffline(isOfflineNow);
            setErrorMessage(
              apiErr?.response?.status === 404
                ? 'Perfil de confeiteiro não encontrado ou perfil privado.'
                : isOfflineNow
                  ? 'Você está offline. Conecte-se à internet para visualizar perfis de outros confeiteiros.'
                  : 'Erro ao carregar o perfil público.',
            );
            setPublicProfile(null);
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

  return {
    publicProfile,
    isLoading,
    hasError,
    errorMessage,
    isOffline,
    refetch: fetchPublicProfile,
  };
}

export function useNearbyBakers() {
  const [bakers, setBakers] = useState<NearbyBakerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(NetworkService.getIsOffline());

  const lastSearchRef = useRef<
    | { type: 'nearby'; params: NearbyBakersQuery }
    | { type: 'neighborhood'; params: NeighborhoodBakersQuery }
    | null
  >(null);

  const searchBakers = useCallback(
    async (params: NearbyBakersQuery, isAppend: boolean = false) => {
      const pageToFetch = params.page ?? (isAppend ? currentPage + 1 : 0);

      if (NetworkService.getIsOffline()) {
        setIsOffline(true);
        setHasError(true);
        setErrorMessage('A busca de confeitarias requer uma conexão com a internet.');
        setIsLoading(false);
        setIsLoadingMore(false);
        return [];
      }

      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        lastSearchRef.current = { type: 'nearby', params };
      }
      setHasError(false);
      setErrorMessage(null);

      try {
        const response = await BakerProfileService.getNearbyBakers({
          ...params,
          page: pageToFetch,
        });
        const list = response?.data?.bakerProfiles || [];
        if (isAppend) {
          setBakers((prev) => [...prev, ...list]);
        } else {
          setBakers(list);
        }
        setCurrentPage(pageToFetch);
        setHasMore(list.length >= 10);
        setIsOffline(false);
        return list;
      } catch (err: unknown) {
        console.error('Error fetching nearby bakers:', err);
        const apiErr = err as ApiError;
        const isOfflineNow = NetworkService.getIsOffline();
        setIsOffline(isOfflineNow);
        setHasError(true);
        setErrorMessage(
          isOfflineNow
            ? 'A busca de confeitarias requer uma conexão com a internet.'
            : apiErr?.response?.data?.message ||
                apiErr?.message ||
                'Não foi possível encontrar confeitarias na região.',
        );
        if (!isAppend) {
          setBakers([]);
          setHasMore(false);
        }
        return [];
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [currentPage],
  );

  const searchBakersByNeighborhood = useCallback(
    async (params: NeighborhoodBakersQuery, isAppend: boolean = false) => {
      const pageToFetch = params.page ?? (isAppend ? currentPage + 1 : 0);

      if (NetworkService.getIsOffline()) {
        setIsOffline(true);
        setHasError(true);
        setErrorMessage('A busca de confeitarias requer uma conexão com a internet.');
        setIsLoading(false);
        setIsLoadingMore(false);
        return [];
      }

      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        lastSearchRef.current = { type: 'neighborhood', params };
      }
      setHasError(false);
      setErrorMessage(null);

      try {
        const response = await BakerProfileService.getBakersByNeighborhood({
          ...params,
          page: pageToFetch,
        });
        const list = response?.data?.bakerProfiles || [];
        if (isAppend) {
          setBakers((prev) => [...prev, ...list]);
        } else {
          setBakers(list);
        }
        setCurrentPage(pageToFetch);
        setHasMore(list.length >= 10);
        setIsOffline(false);
        return list;
      } catch (err: unknown) {
        console.error('Error fetching bakers by neighborhood:', err);
        const apiErr = err as ApiError;
        const isOfflineNow = NetworkService.getIsOffline();
        setIsOffline(isOfflineNow);
        setHasError(true);
        setErrorMessage(
          isOfflineNow
            ? 'A busca de confeitarias requer uma conexão com a internet.'
            : apiErr?.response?.data?.message ||
                apiErr?.message ||
                'Não foi possível encontrar confeitarias para essa localização.',
        );
        if (!isAppend) {
          setBakers([]);
          setHasMore(false);
        }
        return [];
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [currentPage],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore || !lastSearchRef.current) {
      return;
    }
    const nextPage = currentPage + 1;
    if (lastSearchRef.current.type === 'nearby') {
      await searchBakers({ ...lastSearchRef.current.params, page: nextPage }, true);
    } else if (lastSearchRef.current.type === 'neighborhood') {
      await searchBakersByNeighborhood({ ...lastSearchRef.current.params, page: nextPage }, true);
    }
  }, [currentPage, hasMore, isLoading, isLoadingMore, searchBakers, searchBakersByNeighborhood]);

  return {
    bakers,
    isLoading,
    isLoadingMore,
    hasMore,
    currentPage,
    hasError,
    errorMessage,
    isOffline,
    searchBakers,
    searchBakersByNeighborhood,
    loadMore,
    setBakers,
  };
}

export function useMyShowcase(isEnabled: boolean = true) {
  const [showcase, setShowcase] = useState<ShowcaseRecipeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(isEnabled);
  const [isMutating, setIsMutating] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchShowcase = useCallback(async () => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    try {
      const response = await BakerProfileService.getMyShowcase();
      const list = response?.data?.showcase || [];
      setShowcase(list);
    } catch (err: unknown) {
      console.error('Error fetching my showcase:', err);
      const apiErr = err as ApiError;
      setHasError(true);
      setErrorMessage(
        apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível carregar as receitas da vitrine.',
      );
      setShowcase([]);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    let isMounted = true;

    if (!isEnabled) {
      return;
    }

    async function load() {
      try {
        const response = await BakerProfileService.getMyShowcase();
        if (isMounted) {
          setShowcase(response?.data?.showcase || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error loading my showcase:', err);
          const apiErr = err as ApiError;
          setHasError(true);
          setErrorMessage(
            apiErr?.response?.data?.message ||
              apiErr?.message ||
              'Não foi possível carregar as receitas da vitrine.',
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
  }, [isEnabled]);

  const addToShowcase = useCallback(
    async (recipeId: string, order?: number) => {
      setIsMutating(true);
      setHasError(false);
      setErrorMessage(null);
      try {
        await BakerProfileService.addShowcaseRecipe({ recipeId, order });
        await fetchShowcase();
      } catch (err: unknown) {
        console.error('Error adding recipe to showcase:', err);
        const apiErr = err as ApiError;
        const msg =
          apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível adicionar a receita à vitrine.';
        setHasError(true);
        setErrorMessage(msg);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchShowcase],
  );

  const removeFromShowcase = useCallback(
    async (recipeId: string) => {
      setIsMutating(true);
      setHasError(false);
      setErrorMessage(null);
      try {
        await BakerProfileService.removeShowcaseRecipe(recipeId);
        await fetchShowcase();
      } catch (err: unknown) {
        console.error('Error removing recipe from showcase:', err);
        const apiErr = err as ApiError;
        const msg =
          apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível remover a receita da vitrine.';
        setHasError(true);
        setErrorMessage(msg);
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    [fetchShowcase],
  );

  const reorderShowcase = useCallback(async (items: ReorderShowcaseItem[]) => {
    setIsMutating(true);
    setHasError(false);
    setErrorMessage(null);
    try {
      const response = await BakerProfileService.reorderShowcase({ items });
      setShowcase(response?.data?.showcase || []);
    } catch (err: unknown) {
      console.error('Error reordering showcase:', err);
      const apiErr = err as ApiError;
      const msg =
        apiErr?.response?.data?.message ||
        apiErr?.message ||
        'Não foi possível reordenar a vitrine.';
      setHasError(true);
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, []);

  return {
    showcase,
    isLoading,
    isMutating,
    hasError,
    errorMessage,
    refetch: fetchShowcase,
    addToShowcase,
    removeFromShowcase,
    reorderShowcase,
  };
}

export function usePublicShowcase(userId: string | undefined) {
  const [showcase, setShowcase] = useState<ShowcaseRecipeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(userId));
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPublicShowcase = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    try {
      const response = await BakerProfileService.getPublicShowcase(userId);
      setShowcase(response?.data?.showcase || []);
    } catch (err: unknown) {
      console.error('Error fetching public showcase:', err);
      const apiErr = err as ApiError;
      setHasError(true);
      setErrorMessage(
        apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível carregar a vitrine de receitas.',
      );
      setShowcase([]);
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
        const response = await BakerProfileService.getPublicShowcase(userId!);
        if (isMounted) {
          setShowcase(response?.data?.showcase || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error loading public showcase:', err);
          const apiErr = err as ApiError;
          setHasError(true);
          setErrorMessage(
            apiErr?.response?.data?.message ||
              apiErr?.message ||
              'Não foi possível carregar a vitrine de receitas.',
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
  }, [userId]);

  return {
    showcase,
    isLoading,
    hasError,
    errorMessage,
    refetch: fetchPublicShowcase,
  };
}
