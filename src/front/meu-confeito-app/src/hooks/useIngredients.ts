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
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await IngredientService.search(search);
        if (isMounted) {
          setIngredients(res.data.ingredients);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching ingredients: ', err);
          setError('Erro ao buscar ingredientes.');
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
  }, [search]);

  return { ingredients, isLoading, error, refetch: fetchIngredients };
}
