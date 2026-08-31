import { useCallback, useEffect, useState } from 'react';

import { IngredientService } from '../services/ingredient';
import { PartialIngredient } from '../types/ingredient';

export function useIngredients(search?: string) {
  const [ingredients, setIngredients] = useState<PartialIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredients = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await IngredientService.search(search);
      setIngredients(res.data.ingredients);
    } catch (err) {
      console.error('Error fetching ingredients: ', err);
      setError('Erro ao buscar ingredientes.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  return { ingredients, isLoading, error, refetch: fetchIngredients };
}
