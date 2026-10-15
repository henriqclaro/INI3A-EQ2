import { useCallback, useEffect, useRef, useState } from 'react';

import { kvStorage } from '@/src/utils/kvStorage';

export interface UseFormDraftOptions {
  debounceMs?: number;
  isAutoSaveEnabled?: boolean;
}

export interface StoredDraftPayload<T> {
  data: T;
  savedAt: string;
}

export interface UseFormDraftResult<T> {
  hasDraft: boolean;
  hasSavedDraftOnMount: boolean;
  draftTimestamp: Date | null;
  draftData: T | null;
  saveDraft: (data: T) => void;
  clearDraft: () => void;
  discardDraft: () => void;
  restoreDraft: () => T | null;
}

function loadInitialDraft<T>(draftKey: string): {
  hasDraft: boolean;
  draftData: T | null;
  draftTimestamp: Date | null;
} {
  try {
    const stored = kvStorage.getObject<StoredDraftPayload<T>>(draftKey);
    if (stored && stored.data) {
      return {
        hasDraft: true,
        draftData: stored.data,
        draftTimestamp: stored.savedAt ? new Date(stored.savedAt) : null,
      };
    }
  } catch {
    // Ignore error and fall through
  }

  return {
    hasDraft: false,
    draftData: null,
    draftTimestamp: null,
  };
}

export function useFormDraft<T>(
  draftKey: string,
  options: UseFormDraftOptions = {},
): UseFormDraftResult<T> {
  const { debounceMs = 400, isAutoSaveEnabled = true } = options;

  const [initialDraftState] = useState(() => loadInitialDraft<T>(draftKey));

  const [hasSavedDraftOnMount, setHasSavedDraftOnMount] = useState(initialDraftState.hasDraft);
  const [hasDraft, setHasDraft] = useState(initialDraftState.hasDraft);
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(
    initialDraftState.draftTimestamp,
  );
  const [draftData, setDraftData] = useState<T | null>(initialDraftState.draftData);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const saveDraft = useCallback(
    (data: T) => {
      if (!isAutoSaveEnabled) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          const payload: StoredDraftPayload<T> = {
            data,
            savedAt: new Date().toISOString(),
          };
          kvStorage.setObject(draftKey, payload);
          setHasDraft(true);
          setDraftData(data);
          setDraftTimestamp(new Date(payload.savedAt));
        } catch (error) {
          console.warn(`Failed to save draft for ${draftKey}`, error);
        }
      }, debounceMs);
    },
    [draftKey, debounceMs, isAutoSaveEnabled],
  );

  const clearDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    kvStorage.removeItem(draftKey);
    setHasSavedDraftOnMount(false);
    setHasDraft(false);
    setDraftData(null);
    setDraftTimestamp(null);
  }, [draftKey]);

  const discardDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  const restoreDraft = useCallback((): T | null => {
    if (!draftData) {
      const stored = kvStorage.getObject<StoredDraftPayload<T>>(draftKey);
      if (stored?.data) {
        return stored.data;
      }
      return null;
    }
    return draftData;
  }, [draftData, draftKey]);

  return {
    hasDraft,
    hasSavedDraftOnMount,
    draftTimestamp,
    draftData,
    saveDraft,
    clearDraft,
    discardDraft,
    restoreDraft,
  };
}
