import { Image } from 'expo-image';

export interface ClearCacheResult {
  isSuccess: boolean;
  error?: Error;
}

/**
 * Clears the application image and temporary media cache from both memory and disk.
 * This frees up storage space and forces remote images to reload cleanly without
 * affecting user preferences, authentication tokens, or stored recipes.
 */
export async function clearAppCache(): Promise<ClearCacheResult> {
  try {
    await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);

    return {
      isSuccess: true,
    };
  } catch (error) {
    console.warn('Failed to clear application cache:', error);
    return {
      isSuccess: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
