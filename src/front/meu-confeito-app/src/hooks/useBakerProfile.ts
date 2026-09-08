import { useCallback, useEffect, useState } from 'react';

import { BakerProfileService } from '../services/baker-profile';
import {
  BakerProfile,
  BakerProfileRegisterInput,
  BakerProfileUpdateInput,
  PublicBakerProfile,
} from '../types/baker-profile';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export function useMyBakerProfile() {
  const [bakerProfile, setBakerProfile] = useState<BakerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasBakerProfile, setHasBakerProfile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;

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
  }, []);

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
