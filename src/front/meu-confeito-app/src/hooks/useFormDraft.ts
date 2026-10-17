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
  flushDraft: () => void;
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
  const { debounceMs = 500, isAutoSaveEnabled = true } = options;

  const [initialDraftState] = useState(() => loadInitialDraft<T>(draftKey));
  const [hasSavedDraftOnMount, setHasSavedDraftOnMount] = useState(initialDraftState.hasDraft);
  const [hasDraft, setHasDraft] = useState(initialDraftState.hasDraft);
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(
    initialDraftState.draftTimestamp,
  );
  const [draftData, setDraftData] = useState<T | null>(initialDraftState.draftData);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDataRef = useRef<T | null>(null);

  // Flush pending draft on unmount so data is never lost on navigation
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        if (pendingDataRef.current) {
          try {
            const payload: StoredDraftPayload<T> = {
              data: pendingDataRef.current,
              savedAt: new Date().toISOString(),
            };
            kvStorage.setObject(draftKey, payload);
          } catch (error) {
            console.warn(`Failed to flush draft on unmount for ${draftKey}`, error);
          }
        }
      }
    };
  }, [draftKey]);

  const flushDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingDataRef.current) {
      try {
        const payload: StoredDraftPayload<T> = {
          data: pendingDataRef.current,
          savedAt: new Date().toISOString(),
        };
        kvStorage.setObject(draftKey, payload);
        setHasDraft(true);
        setDraftData(pendingDataRef.current);
        setDraftTimestamp(new Date(payload.savedAt));
        pendingDataRef.current = null;
      } catch (error) {
        console.warn(`Failed to flush draft for ${draftKey}`, error);
      }
    }
  }, [draftKey]);

  const saveDraft = useCallback(
    (data: T) => {
      if (!isAutoSaveEnabled) return;

      pendingDataRef.current = data;

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
          pendingDataRef.current = null;
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
    pendingDataRef.current = null;
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
    flushDraft,
    clearDraft,
    discardDraft,
    restoreDraft,
  };
}
