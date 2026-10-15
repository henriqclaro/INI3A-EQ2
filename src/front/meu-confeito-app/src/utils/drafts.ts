import { kvStorage } from '@/src/utils/kvStorage';

export interface ClearDraftsResult {
  isSuccess: boolean;
  clearedCount: number;
}

/**
 * Returns all keys in kvStorage associated with form drafts.
 */
export function getSavedDraftKeys(): string[] {
  try {
    const keys = kvStorage.getAllKeys();
    const draftKeys = keys.filter((key) => key.startsWith('draft_'));
    return Array.from(new Set(draftKeys));
  } catch {
    return [];
  }
}

/**
 * Checks whether any form draft exists in local storage.
 */
export function hasAnySavedDraft(): boolean {
  try {
    const draftKeys = getSavedDraftKeys();
    if (draftKeys.length > 0) return true;

    // Check default known draft key if getAllKeys was limited
    const defaultDraft = kvStorage.getObject('draft_recipe_create');
    return Boolean(defaultDraft);
  } catch {
    return false;
  }
}

/**
 * Clears all form draft payloads from local key-value storage.
 */
export function clearAllFormDrafts(): ClearDraftsResult {
  try {
    const draftKeys = getSavedDraftKeys();

    // Include standard draft key explicitly as safeguard
    if (!draftKeys.includes('draft_recipe_create')) {
      draftKeys.push('draft_recipe_create');
    }

    let count = 0;
    for (const key of draftKeys) {
      const hasItem = kvStorage.getString(key) !== null;
      if (hasItem) {
        count++;
      }
      kvStorage.removeItem(key);
    }

    return {
      isSuccess: true,
      clearedCount: count,
    };
  } catch (error) {
    console.warn('Failed to clear all form drafts:', error);
    return {
      isSuccess: false,
      clearedCount: 0,
    };
  }
}
