import AsyncStorage from '@react-native-async-storage/async-storage';

import { PartialRecipe } from '../types';
import { BakerProfile } from '../types/baker-profile';
import { UserReviewItem } from '../types/review';
import { UserSavedRecipeItem } from '../types/saved-recipe';

const USER_RECIPES_KEY = '@meu_confeito_cached_user_recipes';
const SAVED_RECIPES_KEY = '@meu_confeito_cached_saved_recipes';
const ARCHIVED_RECIPES_KEY = '@meu_confeito_cached_archived_recipes';
const BAKER_PROFILE_KEY = '@meu_confeito_cached_baker_profile';
const USER_REVIEWS_KEY = '@meu_confeito_cached_user_reviews';
const PUBLIC_RECIPES_KEY = '@meu_confeito_cached_public_recipes';

const MAX_CACHED_RECIPES = 50;
const MAX_CACHED_SAVES = 50;
const MAX_CACHED_ARCHIVED = 30;
const MAX_CACHED_REVIEWS = 30;
const MAX_CACHED_PUBLIC = 30;

// In-Memory L1 Cache for zero-latency screen renders
let memoryUserRecipes: PartialRecipe[] | null = null;
let memorySavedRecipes: UserSavedRecipeItem[] | null = null;
let memoryArchivedRecipes: PartialRecipe[] | null = null;
let memoryBakerProfile: BakerProfile | null = null;
let memoryUserReviews: UserReviewItem[] | null = null;
let memoryPublicRecipes: PartialRecipe[] | null = null;

function compactRecipe(recipe: PartialRecipe): PartialRecipe {
  return {
    id: recipe.id,
    title: recipe.title,
    coverUrl: recipe.coverUrl,
    profitMargin: recipe.profitMargin,
    overhead: recipe.overhead,
    hourlyLabor: recipe.hourlyLabor,
    packagingCost: recipe.packagingCost,
    prepTimeMinutes: recipe.prepTimeMinutes,
    status: recipe.status,
    totalSaves: recipe.totalSaves,
    totalReviews: recipe.totalReviews,
    averageRating: recipe.averageRating,
    baseYield: recipe.baseYield,
    yieldUnit: recipe.yieldUnit,
    parent: recipe.parent,
    tags: recipe.tags,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

function compactSavedRecipe(item: UserSavedRecipeItem): UserSavedRecipeItem {
  return {
    savedAt: item.savedAt,
    recipe: {
      id: item.recipe.id,
      title: item.recipe.title,
      coverUrl: item.recipe.coverUrl,
      baseYield: item.recipe.baseYield,
      yieldUnit: item.recipe.yieldUnit,
      profitMargin: item.recipe.profitMargin,
      overhead: item.recipe.overhead,
      hourlyLabor: item.recipe.hourlyLabor,
      packagingCost: item.recipe.packagingCost,
      prepTimeMinutes: item.recipe.prepTimeMinutes,
      status: item.recipe.status,
      updatedAt: item.recipe.updatedAt,
      tags: item.recipe.tags,
    },
  };
}

export const OfflineCacheService = {
  // ---------------------------------------------------------------------------
  // USER RECIPES
  // ---------------------------------------------------------------------------
  getUserRecipesFast(): PartialRecipe[] | null {
    return memoryUserRecipes;
  },

  async getUserRecipes(): Promise<PartialRecipe[]> {
    if (memoryUserRecipes !== null) {
      return memoryUserRecipes;
    }
    try {
      const raw = await AsyncStorage.getItem(USER_RECIPES_KEY);
      if (!raw) {
        memoryUserRecipes = [];
        return [];
      }
      memoryUserRecipes = JSON.parse(raw) as PartialRecipe[];
      return memoryUserRecipes;
    } catch {
      memoryUserRecipes = [];
      return [];
    }
  },

  async saveUserRecipes(recipes: PartialRecipe[]): Promise<void> {
    if (!Array.isArray(recipes)) return;
    const compacted = recipes.slice(0, MAX_CACHED_RECIPES).map(compactRecipe);
    memoryUserRecipes = compacted;
    try {
      await AsyncStorage.setItem(USER_RECIPES_KEY, JSON.stringify(compacted));
    } catch (err) {
      console.warn('Failed to cache user recipes offline:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // SAVED RECIPES
  // ---------------------------------------------------------------------------
  getSavedRecipesFast(): UserSavedRecipeItem[] | null {
    return memorySavedRecipes;
  },

  async getSavedRecipes(): Promise<UserSavedRecipeItem[]> {
    if (memorySavedRecipes !== null) {
      return memorySavedRecipes;
    }
    try {
      const raw = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
      if (!raw) {
        memorySavedRecipes = [];
        return [];
      }
      memorySavedRecipes = JSON.parse(raw) as UserSavedRecipeItem[];
      return memorySavedRecipes;
    } catch {
      memorySavedRecipes = [];
      return [];
    }
  },

  async saveSavedRecipes(saves: UserSavedRecipeItem[]): Promise<void> {
    if (!Array.isArray(saves)) return;
    const compacted = saves.slice(0, MAX_CACHED_SAVES).map(compactSavedRecipe);
    memorySavedRecipes = compacted;
    try {
      await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(compacted));
    } catch (err) {
      console.warn('Failed to cache saved recipes offline:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // ARCHIVED RECIPES
  // ---------------------------------------------------------------------------
  getArchivedRecipesFast(): PartialRecipe[] | null {
    return memoryArchivedRecipes;
  },

  async getArchivedRecipes(): Promise<PartialRecipe[]> {
    if (memoryArchivedRecipes !== null) {
      return memoryArchivedRecipes;
    }
    try {
      const raw = await AsyncStorage.getItem(ARCHIVED_RECIPES_KEY);
      if (!raw) {
        memoryArchivedRecipes = [];
        return [];
      }
      memoryArchivedRecipes = JSON.parse(raw) as PartialRecipe[];
      return memoryArchivedRecipes;
    } catch {
      memoryArchivedRecipes = [];
      return [];
    }
  },

  async saveArchivedRecipes(recipes: PartialRecipe[]): Promise<void> {
    if (!Array.isArray(recipes)) return;
    const compacted = recipes.slice(0, MAX_CACHED_ARCHIVED).map(compactRecipe);
    memoryArchivedRecipes = compacted;
    try {
      await AsyncStorage.setItem(ARCHIVED_RECIPES_KEY, JSON.stringify(compacted));
    } catch (err) {
      console.warn('Failed to cache archived recipes offline:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // BAKER PROFILE
  // ---------------------------------------------------------------------------
  getBakerProfileFast(expectedUserId?: string): BakerProfile | null {
    if (expectedUserId && memoryBakerProfile && memoryBakerProfile.userId !== expectedUserId) {
      return null;
    }
    return memoryBakerProfile;
  },

  async getBakerProfile(expectedUserId?: string): Promise<BakerProfile | null> {
    if (memoryBakerProfile !== null) {
      if (expectedUserId && memoryBakerProfile.userId !== expectedUserId) {
        return null;
      }
      return memoryBakerProfile;
    }
    try {
      const raw = await AsyncStorage.getItem(BAKER_PROFILE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as BakerProfile;
      if (expectedUserId && parsed && parsed.userId !== expectedUserId) {
        return null;
      }
      memoryBakerProfile = parsed;
      return memoryBakerProfile;
    } catch {
      return null;
    }
  },

  async saveBakerProfile(profile: BakerProfile | null): Promise<void> {
    memoryBakerProfile = profile;
    try {
      if (profile) {
        await AsyncStorage.setItem(BAKER_PROFILE_KEY, JSON.stringify(profile));
      } else {
        await AsyncStorage.removeItem(BAKER_PROFILE_KEY);
      }
    } catch (err) {
      console.warn('Failed to cache baker profile offline:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // USER REVIEWS
  // ---------------------------------------------------------------------------
  getUserReviewsFast(): UserReviewItem[] | null {
    return memoryUserReviews;
  },

  async getUserReviews(): Promise<UserReviewItem[]> {
    if (memoryUserReviews !== null) {
      return memoryUserReviews;
    }
    try {
      const raw = await AsyncStorage.getItem(USER_REVIEWS_KEY);
      if (!raw) {
        memoryUserReviews = [];
        return [];
      }
      memoryUserReviews = JSON.parse(raw) as UserReviewItem[];
      return memoryUserReviews;
    } catch {
      memoryUserReviews = [];
      return [];
    }
  },

  async saveUserReviews(reviews: UserReviewItem[]): Promise<void> {
    if (!Array.isArray(reviews)) return;
    const compacted = reviews.slice(0, MAX_CACHED_REVIEWS);
    memoryUserReviews = compacted;
    try {
      await AsyncStorage.setItem(USER_REVIEWS_KEY, JSON.stringify(compacted));
    } catch (err) {
      console.warn('Failed to cache user reviews offline:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // PUBLIC DISCOVERY / EXPLORE RECIPES
  // ---------------------------------------------------------------------------
  getPublicRecipesFast(): PartialRecipe[] | null {
    return memoryPublicRecipes;
  },

  async getPublicRecipes(): Promise<PartialRecipe[]> {
    if (memoryPublicRecipes !== null) {
      return memoryPublicRecipes;
    }
    try {
      const raw = await AsyncStorage.getItem(PUBLIC_RECIPES_KEY);
      if (!raw) {
        memoryPublicRecipes = [];
        return [];
      }
      memoryPublicRecipes = JSON.parse(raw) as PartialRecipe[];
      return memoryPublicRecipes;
    } catch {
      memoryPublicRecipes = [];
      return [];
    }
  },

  async savePublicRecipes(recipes: PartialRecipe[]): Promise<void> {
    if (!Array.isArray(recipes)) return;
    const compacted = recipes.slice(0, MAX_CACHED_PUBLIC).map(compactRecipe);
    memoryPublicRecipes = compacted;
    try {
      await AsyncStorage.setItem(PUBLIC_RECIPES_KEY, JSON.stringify(compacted));
    } catch (err) {
      console.warn('Failed to cache public recipes offline:', err);
    }
  },

  // ---------------------------------------------------------------------------
  // SESSION / USER CACHE EVICTION
  // ---------------------------------------------------------------------------
  async clearUserCache(): Promise<void> {
    memoryUserRecipes = null;
    memorySavedRecipes = null;
    memoryArchivedRecipes = null;
    memoryBakerProfile = null;
    memoryUserReviews = null;

    try {
      await AsyncStorage.multiRemove([
        USER_RECIPES_KEY,
        SAVED_RECIPES_KEY,
        ARCHIVED_RECIPES_KEY,
        BAKER_PROFILE_KEY,
        USER_REVIEWS_KEY,
      ]);
    } catch (err) {
      console.warn('Failed to clear user offline cache:', err);
    }
  },
};
