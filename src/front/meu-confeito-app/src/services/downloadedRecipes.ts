import { Image } from 'expo-image';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ClearDownloadedRecipesResult,
  DownloadedRecipe,
  FullRecipe,
  PartialRecipe,
} from '../types';
import { getStorageUrl } from '../utils/image';

const STORAGE_KEY = '@meu_confeito_downloaded_recipes';

type DownloadedRecipesListener = () => void;
const listeners = new Set<DownloadedRecipesListener>();

let memoryCache: Map<string, DownloadedRecipe> | null = null;
let isCacheLoaded = false;

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (err) {
      console.warn('Error in downloaded recipes listener:', err);
    }
  }
}

async function loadCacheFromStorage(): Promise<Map<string, DownloadedRecipe>> {
  if (isCacheLoaded && memoryCache !== null) {
    return memoryCache;
  }

  try {
    const rawData = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      memoryCache = new Map<string, DownloadedRecipe>();
      isCacheLoaded = true;
      return memoryCache;
    }

    const parsed = JSON.parse(rawData) as Record<string, DownloadedRecipe>;
    memoryCache = new Map<string, DownloadedRecipe>(Object.entries(parsed));
    isCacheLoaded = true;
    return memoryCache;
  } catch (error) {
    console.warn('Failed to load downloaded recipes from storage:', error);
    memoryCache = new Map<string, DownloadedRecipe>();
    isCacheLoaded = true;
    return memoryCache;
  }
}

async function persistCacheToStorage(): Promise<void> {
  if (!memoryCache) return;

  try {
    const record: Record<string, DownloadedRecipe> = {};
    for (const [id, item] of memoryCache.entries()) {
      record[id] = item;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    console.error('Failed to persist downloaded recipes to storage:', error);
  }
}

export const DownloadedRecipeService = {
  /**
   * Subscribes a callback to changes in downloaded recipes.
   */
  subscribe(listener: DownloadedRecipesListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /**
   * Retrieves all downloaded recipes currently stored locally.
   */
  async getAllDownloadedRecipes(): Promise<DownloadedRecipe[]> {
    const cache = await loadCacheFromStorage();
    return Array.from(cache.values()).sort(
      (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime(),
    );
  },

  /**
   * Retrieves a single downloaded recipe by its ID.
   */
  async getDownloadedRecipe(recipeId: string): Promise<DownloadedRecipe | null> {
    if (!recipeId) return null;
    const cache = await loadCacheFromStorage();
    return cache.get(recipeId) ?? null;
  },

  /**
   * Checks synchronously (from memory cache if available) or asynchronously whether a recipe is downloaded.
   */
  async isRecipeDownloaded(recipeId: string): Promise<boolean> {
    if (!recipeId) return false;
    const cache = await loadCacheFromStorage();
    return cache.has(recipeId);
  },

  /**
   * Checks whether a newer version of the recipe is available compared to the downloaded copy.
   */
  async hasDownloadedRecipeUpdate(
    recipeId: string,
    currentUpdatedAt?: string | Date | null,
    currentRecipe?: FullRecipe | PartialRecipe | null,
  ): Promise<boolean> {
    if (!recipeId) return false;
    const cache = await loadCacheFromStorage();
    const downloaded = cache.get(recipeId);
    if (!downloaded) return false;

    // Compare updated dates
    if (currentUpdatedAt) {
      const currentTimestamp = new Date(currentUpdatedAt).getTime();
      const downloadedTimestamp = new Date(downloaded.recipeUpdatedAt).getTime();

      if (!isNaN(currentTimestamp) && !isNaN(downloadedTimestamp)) {
        return currentTimestamp > downloadedTimestamp;
      }

      const currentIso = new Date(currentUpdatedAt).toISOString();
      const downloadedIso = new Date(downloaded.recipeUpdatedAt).toISOString();
      if (currentIso !== downloadedIso) {
        return true;
      }
    }

    if (currentRecipe && currentRecipe.updatedAt) {
      const currentTimestamp = new Date(currentRecipe.updatedAt).getTime();
      const downloadedTimestamp = new Date(downloaded.recipeUpdatedAt).getTime();
      if (!isNaN(currentTimestamp) && !isNaN(downloadedTimestamp)) {
        return currentTimestamp > downloadedTimestamp;
      }
    }

    return false;
  },

  /**
   * Saves or updates a recipe in the local offline storage.
   * Also prefetches the cover image for seamless offline viewing.
   */
  async saveDownloadedRecipe(
    recipe: FullRecipe,
    isOwner: boolean = false,
  ): Promise<DownloadedRecipe> {
    if (!recipe?.id) {
      throw new Error('Cannot download recipe without a valid ID.');
    }

    const cache = await loadCacheFromStorage();
    const recipeUpdatedAtIso = recipe.updatedAt
      ? new Date(recipe.updatedAt).toISOString()
      : new Date().toISOString();

    const entry: DownloadedRecipe = {
      id: recipe.id,
      recipe,
      downloadedAt: new Date().toISOString(),
      recipeUpdatedAt: recipeUpdatedAtIso,
      isOwner,
    };

    cache.set(recipe.id, entry);
    await persistCacheToStorage();

    // Prefetch cover image so expo-image keeps it in disk cache for offline use
    if (recipe.coverUrl) {
      const resolvedUrl = getStorageUrl(recipe.coverUrl, recipe.updatedAt);
      if (resolvedUrl) {
        Image.prefetch(resolvedUrl).catch(() => {});
      }
    }

    notifyListeners();
    return entry;
  },

  /**
   * Automatically updates an existing downloaded recipe if it was already saved locally.
   * Useful when an owner edits their recipe or saves changes.
   */
  async updateDownloadedRecipeIfSaved(
    recipe: FullRecipe,
    isOwner: boolean = false,
  ): Promise<boolean> {
    if (!recipe?.id) return false;
    const cache = await loadCacheFromStorage();

    if (!cache.has(recipe.id)) {
      return false;
    }

    const existing = cache.get(recipe.id)!;
    const recipeUpdatedAtIso = recipe.updatedAt
      ? new Date(recipe.updatedAt).toISOString()
      : new Date().toISOString();

    const updatedEntry: DownloadedRecipe = {
      ...existing,
      recipe,
      recipeUpdatedAt: recipeUpdatedAtIso,
      isOwner: isOwner ?? existing.isOwner,
    };

    cache.set(recipe.id, updatedEntry);
    await persistCacheToStorage();

    if (recipe.coverUrl) {
      const resolvedUrl = getStorageUrl(recipe.coverUrl, recipe.updatedAt);
      if (resolvedUrl) {
        Image.prefetch(resolvedUrl).catch(() => {});
      }
    }

    notifyListeners();
    return true;
  },

  /**
   * Removes a single downloaded recipe from offline storage.
   */
  async removeDownloadedRecipe(recipeId: string): Promise<boolean> {
    if (!recipeId) return false;
    const cache = await loadCacheFromStorage();

    if (!cache.has(recipeId)) {
      return false;
    }

    cache.delete(recipeId);
    await persistCacheToStorage();
    notifyListeners();
    return true;
  },

  /**
   * Clears all downloaded recipes from offline storage.
   */
  async clearAllDownloadedRecipes(): Promise<ClearDownloadedRecipesResult> {
    const cache = await loadCacheFromStorage();
    const count = cache.size;

    cache.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
    notifyListeners();

    return {
      isSuccess: true,
      clearedCount: count,
    };
  },

  /**
   * Returns the count of downloaded recipes currently in cache.
   */
  async getDownloadedCount(): Promise<number> {
    const cache = await loadCacheFromStorage();
    return cache.size;
  },
};
