import { useCallback, useEffect, useState } from 'react';

import { RecipeService } from '../services/recipe';
import { UserService } from '../services/user';
import { PartialRecipe } from '../types';
import {
  FullRecipe,
  RecipeRegisterInput,
  RecipeStatus,
  UpdateRecipeVisibilityInput,
} from '../types/recipe';

export function useManyRecipes(search?: string, page?: number) {
  const [recipes, setRecipes] = useState<PartialRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await RecipeService.search(search, page);
      setRecipes(res.data.recipes);
    } catch (err) {
      console.error('Error fetching Recipes: ', err);
      setError('Error searching recipes.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await RecipeService.search(search, page);
        if (isMounted) {
          setRecipes(res.data.recipes);
        }
      } catch (err) {
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
  }, [search, page]);

  return { recipes, isLoading, error, refetch: fetchRecipes };
}

export function useSingleRecipe(recipeId: string, userId?: string) {
  const [recipe, setRecipe] = useState<FullRecipe>();
  const [isLoading, setIsLoading] = useState(Boolean(recipeId));
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
    } catch (err) {
      console.error('Error fetching recipe: ', err);
      setError('Error fetching recipe.');
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
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching recipe: ', err);
          setError('Error fetching recipe.');
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
      setRecipe((prev) => (prev ? { ...prev, status: res.data.recipe.status } : prev));
      return res;
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  return { recipe, isLoading, error, refetch: fetchRecipe, updateVisibility, isUpdatingVisibility };
}

export function useUserRecipes(userId: string | undefined) {
  const [recipes, setRecipes] = useState<PartialRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const fetchUserRecipes = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await UserService.getRecipes(userId);
      setRecipes(res.data.recipes);
    } catch (err) {
      console.error('Error fetching User Recipes: ', err);
      setError('Error fetching recipes.');
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
        const res = await UserService.getRecipes(userId!);
        if (isMounted) {
          setRecipes(res.data.recipes);
        }
      } catch (err) {
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
  }, [userId]);

  return { recipes, isLoading, error, refetch: fetchUserRecipes };
}

export function useRecipeRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerRecipe = async (data: RecipeRegisterInput) => {
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
