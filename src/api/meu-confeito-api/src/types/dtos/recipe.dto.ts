import type { Decimal, JsonValue } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type * as recipe from '../../validation/recipe.schema';

export namespace RecipeDTO {
  export type RegisterRequest = z.infer<typeof recipe.registerSchema>;
  export interface RegisterResponse {
    recipe: {
      id: string;
      userId: string | null;
      parentId: string | null;
      title: string;
      coverUrl: string | null;
      instructions: JsonValue;
      baseYield: Decimal;

      yieldUnit: string;
      profitMargin: Decimal;
      overhead: Decimal;
      prepTimeMinutes: number;
      hourlyLabor: Decimal;
      packagingCost: Decimal;

      createdAt: Date;

      ingredients: {
        ingredientId: string;
        baseQuantity: Decimal;
        measurementUnit: string;
        notes: string | null;
      }[];
    };
  }

  export type RequestParam = z.infer<typeof recipe.paramsSchema>;
  export type UserInventoryRequestParam = z.infer<typeof recipe.userInventoryParamsSchema>;

  export interface SingleSelectResponse {
    recipe: {
      id: string;
      userId: string | null;
      parentId: string | null;
      title: string;
      coverUrl: string | null;
      instructions: JsonValue;
      baseYield: Decimal;
      yieldUnit: string;

      status: string;
      totalSaves: number;
      totalReviews: number;
      averageRating: Decimal;

      profitMargin: Decimal;
      overhead: Decimal;
      prepTimeMinutes: number;
      hourlyLabor: Decimal;
      packagingCost: Decimal;

      createdAt: Date;
      updatedAt: Date;

      ingredients: {
        ingredientId: string;
        baseQuantity: Decimal;
        measurementUnit: string;
        notes: string | null;
        ingredient: {
          id: string;
          name: string[];
          category: string;
        };
      }[];
    };
  }

  export interface SingleSelectUserInventoryResponse {
    recipe: {
      id: string;
      userId: string | null;
      parentId: string | null;
      title: string;
      coverUrl: string | null;
      instructions: JsonValue;
      baseYield: Decimal;
      yieldUnit: string;

      status: string;
      totalSaves: number;
      totalReviews: number;
      averageRating: Decimal;

      profitMargin: Decimal;
      overhead: Decimal;
      prepTimeMinutes: number;
      hourlyLabor: Decimal;
      packagingCost: Decimal;

      createdAt: Date;
      updatedAt: Date;

      ingredients: {
        ingredientId: string;
        baseQuantity: Decimal;
        measurementUnit: string;
        notes: string | null;
        ingredient: {
          id: string;
          name: string[];
          category: string;
          description: string | null;
        };
        inventory: {
          currentQuantity: Decimal;
          measurementUnit: string;
          packagePrice: Decimal;
          packageSize: Decimal;
          costUnit: Decimal;
          lastUpdated: Date;
        } | null;
      }[];
    };
  }

  export interface SearchResponse {
    recipes: {
      title: string;
      coverUrl: string | null;
      profitMargin: Decimal;
      overhead: Decimal;
      hourlyLabor: Decimal;
      packagingCost: Decimal;
      prepTimeMinutes: number;
      id: string;
      createdAt: Date;
      updatedAt: Date;
      tags: {
        tag: {
          type: string;
          id: string;
          name: string;
        };
      }[];
    }[];
  }

  export type UpdateVisibilityRequest = z.infer<typeof recipe.updateVisibilitySchema>;
  export interface UpdateVisibilityResponse {
    recipe: {
      id: string;
      userId: string | null;
      title: string;
      status: string;
      updatedAt: Date;
    };
  }
}
