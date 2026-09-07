import { useCallback, useEffect, useState } from 'react';

import { TagService } from '../services/tag';
import { Tag, TagType } from '../types/tag';

export function useTags(searchTerm?: string, tagType?: TagType) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(
    async (query?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const searchQuery = query !== undefined ? query : searchTerm;
        const res = await TagService.search(searchQuery, undefined, tagType);
        setTags(res.data.tags);
      } catch (err) {
        console.error('Error fetching tags: ', err);
        setError('Erro ao carregar tags.');
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, tagType],
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await TagService.search(searchTerm, undefined, tagType);
        if (isMounted) {
          setTags(res.data.tags);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching tags: ', err);
          setError('Erro ao carregar tags.');
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
  }, [searchTerm, tagType]);

  return { tags, isLoading, error, refetch: fetchTags };
}
