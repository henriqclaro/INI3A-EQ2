import { useCallback, useEffect, useState } from 'react';

import { BakerProfileService } from '../services/baker-profile';
import {
  BakerProfile,
  BakerProfileRegisterInput,
  BakerProfileUpdateInput,
  NearbyBakerItem,
  NearbyBakersQuery,
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
      } else {
        setBakerProfile(null);
        setHasBakerProfile(false);
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      // 404 means the user has not created a baker profile yet (private profile)
      if (apiErr?.response?.status === 404) {
        setBakerProfile(null);
        setHasBakerProfile(false);
      } else {
        console.error('Error fetching baker profile:', err);
        setError('Não foi possível carregar o perfil de confeiteiro.');
        setBakerProfile(null);
        setHasBakerProfile(false);
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
      try {
        const response = await BakerProfileService.getMyProfile();
        if (isMounted) {
          if (response?.data?.bakerProfile) {
            setBakerProfile(response.data.bakerProfile);
            setHasBakerProfile(true);
          } else {
            setBakerProfile(null);
            setHasBakerProfile(false);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err as ApiError;
          if (apiErr?.response?.status === 404) {
            setBakerProfile(null);
            setHasBakerProfile(false);
          } else {
            console.error('Error loading baker profile:', err);
            setError('Não foi possível carregar o perfil de confeiteiro.');
            setBakerProfile(null);
            setHasBakerProfile(false);
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
    setIsSaving(true);
    setError(null);
    try {
      if (hasExistingProfile) {
        const response = await BakerProfileService.updateMyProfile(data);
        return response.data.bakerProfile;
      } else {
        const response = await BakerProfileService.createMyProfile(data);
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
    setIsDeleting(true);
    setError(null);
    try {
      await BakerProfileService.deleteMyProfile();
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
    } catch (err: unknown) {
      console.error('Error fetching public baker profile:', err);
      const apiErr = err as ApiError;
      setHasError(true);
      setErrorMessage(
        apiErr?.response?.status === 404
          ? 'Perfil de confeiteiro não encontrado ou perfil privado.'
          : 'Erro ao carregar o perfil público.',
      );
      setPublicProfile(null);
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
        const response = await BakerProfileService.getPublicProfile(userId!);
        if (isMounted) {
          setPublicProfile(response.data.bakerProfile);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Error loading public baker profile:', err);
          const apiErr = err as ApiError;
          setHasError(true);
          setErrorMessage(
            apiErr?.response?.status === 404
              ? 'Perfil de confeiteiro não encontrado ou perfil privado.'
              : 'Erro ao carregar o perfil público.',
          );
          setPublicProfile(null);
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
    refetch: fetchPublicProfile,
  };
}

export function useNearbyBakers() {
  const [bakers, setBakers] = useState<NearbyBakerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchBakers = useCallback(async (params: NearbyBakersQuery) => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    try {
      const response = await BakerProfileService.getNearbyBakers(params);
      const list = response?.data?.bakerProfiles || [];
      setBakers(list);
      return list;
    } catch (err: unknown) {
      console.error('Error fetching nearby bakers:', err);
      const apiErr = err as ApiError;
      setHasError(true);
      setErrorMessage(
        apiErr?.response?.data?.message ||
          apiErr?.message ||
          'Não foi possível encontrar confeitarias na região.',
      );
      setBakers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    bakers,
    isLoading,
    hasError,
    errorMessage,
    searchBakers,
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
