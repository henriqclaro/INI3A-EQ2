import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { UserService } from '../services/user';
import { UserSavedRecipeItem } from '../types/saved-recipe';

export function useSavedRecipes(userId: string | undefined) {
  const [savedRecipes, setSavedRecipes] = useState<UserSavedRecipeItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [isTogglingSave, setIsTogglingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedRecipes = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await UserService.getSavedRecipes(userId);
      setSavedRecipes(res.data?.userSaves || []);
    } catch (err) {
      console.error('Error fetching saved recipes: ', err);
      setError('Erro ao carregar receitas salvas.');
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
        const res = await UserService.getSavedRecipes(userId!);
        if (isMounted) {
          setSavedRecipes(res.data?.userSaves || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching saved recipes: ', err);
          setError('Erro ao carregar receitas salvas.');
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

  const isRecipeSaved = useCallback(
    (recipeId: string): boolean => {
      return savedRecipes.some((item) => item.recipe.id === recipeId);
    },
    [savedRecipes],
  );

  const saveRecipe = useCallback(
    async (recipeId: string): Promise<boolean> => {
      if (!userId) {
        Alert.alert('Login Necessário', 'Faça login para salvar esta receita.');
        return false;
      }

      setIsTogglingSave(true);
      try {
        await UserService.saveRecipe(userId, recipeId);
        await fetchSavedRecipes();
        return true;
      } catch (err: unknown) {
        const apiErr = err as {
          response?: {
            data?: {
              code?: string;
              message?: string;
            };
          };
          message?: string;
        };

        if (apiErr?.response?.data?.code === 'RESOURCE_ALREADY_EXISTS') {
          await fetchSavedRecipes();
          return true;
        }

        const errorMsg =
          apiErr?.response?.data?.message || apiErr?.message || 'Erro ao salvar a receita.';
        Alert.alert('Erro ao Salvar', errorMsg);
        return false;
      } finally {
        setIsTogglingSave(false);
      }
    },
    [userId, fetchSavedRecipes],
  );

  const removeSave = useCallback(
    async (recipeId: string): Promise<boolean> => {
      if (!userId) return false;

      setIsTogglingSave(true);
      try {
        await UserService.removeSavedRecipe(userId, recipeId);
        setSavedRecipes((prev) => prev.filter((item) => item.recipe.id !== recipeId));
        return true;
      } catch (err: unknown) {
        const apiErr = err as {
          response?: {
            data?: {
              message?: string;
            };
          };
          message?: string;
        };
        const errorMsg =
          apiErr?.response?.data?.message || apiErr?.message || 'Erro ao remover dos salvos.';
        Alert.alert('Erro ao Remover', errorMsg);
        return false;
      } finally {
        setIsTogglingSave(false);
      }
    },
    [userId],
  );

  const toggleSave = useCallback(
    async (recipeId: string): Promise<boolean> => {
      const hasSaved = isRecipeSaved(recipeId);
      if (hasSaved) {
        return removeSave(recipeId);
      }
      return saveRecipe(recipeId);
    },
    [isRecipeSaved, removeSave, saveRecipe],
  );

  return {
    savedRecipes,
    isLoading,
    isTogglingSave,
    error,
    isRecipeSaved,
    saveRecipe,
    removeSave,
    toggleSave,
    refetch: fetchSavedRecipes,
  };
}
