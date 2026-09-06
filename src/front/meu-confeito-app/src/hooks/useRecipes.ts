import { useCallback, useEffect, useState } from 'react';

import { RecipeService } from '../services/recipe';
import { UserService } from '../services/user';
import { PartialRecipe } from '../types';
import { FullRecipe, RecipeRegisterInput } from '../types/recipe';

export function useManyRecipes(search?: string) {
  const [recipes, setRecipes] = useState<PartialRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    try {
      const res = search ? await RecipeService.search(search) : await RecipeService.search();

      setRecipes(res.data.recipes);
    } catch (error) {
      console.error('Error fetching Recipes: ', error);
      setError('Error searching recipes.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, isLoading, error, refetch: fetchRecipes };
}

export function useSingleRecipe(recipeId: string) {
  const [recipe, setRecipe] = useState<FullRecipe>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = useCallback(async () => {
    try {
      const res = await RecipeService.getRecipe(recipeId);

      setRecipe(res.data.recipe);
    } catch (error) {
      console.error('Error fetching recipe: ', error);
      setError('Error fetching recipe.');
    } finally {
      setIsLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  return { recipe, isLoading, error, refetch: fetchRecipe };
}

export function useUserRecipes(userId: string | undefined) {
  const [recipes, setRecipes] = useState<PartialRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRecipes = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const res = await UserService.getRecipes(userId);

      setRecipes(res.data.recipes);
    } catch (error) {
      console.error('Error fetching User Recipes: ', error);
      setError('Error fetching recipes.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserRecipes();
  }, [fetchUserRecipes]);

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
