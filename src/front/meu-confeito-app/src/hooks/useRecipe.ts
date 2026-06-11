import { useCallback, useEffect, useState } from 'react';

import { RecipeService } from '../services/recipe';
import { FullRecipe } from '../types/recipe';

export function useRecipe(recipeId: string) {
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
