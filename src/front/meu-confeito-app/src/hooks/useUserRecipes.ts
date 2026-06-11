import { useCallback, useEffect, useState } from 'react';

import { UserService } from '../services/user';
import { PartialRecipe } from '../types';

export function useUserRecipes(userId: string) {
  const [recipes, setRecipes] = useState<PartialRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRecipes = useCallback(async () => {
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
