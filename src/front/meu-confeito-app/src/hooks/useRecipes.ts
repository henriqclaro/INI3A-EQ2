import { useCallback, useEffect, useState } from 'react';

import { RecipeService } from '../services/recipe';
import { PartialRecipe } from '../types';

export function useRecipes(search?: string) {
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
