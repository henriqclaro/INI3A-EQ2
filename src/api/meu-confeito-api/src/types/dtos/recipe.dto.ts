import type { Decimal, JsonValue } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type { TagType } from '../../generated/prisma/client';
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

      items: {
        id: string;
        ingredientId: number | null;
        subRecipeId: string | null;
        quantity: Decimal;
        unit: string;
        displayQuantity: Decimal | null;
        displayUnit: string | null;
        sortOrder: number;
        notes: string | null;
      }[];
    };
  }

  export type RequestParam = z.infer<typeof recipe.paramsSchema>;
  export type UserInventoryRequestParam = z.infer<typeof recipe.userInventoryParamsSchema>;
  export type QueryRequest = z.infer<typeof recipe.querySchema>;

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

      items: {
        id: string;
        ingredientId: number | null;
        subRecipeId: string | null;
        quantity: Decimal;
        unit: string;
        displayQuantity: Decimal | null;
        displayUnit: string | null;
        sortOrder: number;
        notes: string | null;
        ingredient: {
          id: number;
          name: string;
          slug: string;
          category: string;
          baseDimension: string;
          baseUnit: string;
        } | null;
        subRecipe: {
          id: string;
          title: string;
          baseYield: Decimal;
          yieldUnit: string;
        } | null;
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

      items: {
        id: string;
        ingredientId: number | null;
        subRecipeId: string | null;
        quantity: Decimal;
        unit: string;
        displayQuantity: Decimal | null;
        displayUnit: string | null;
        sortOrder: number;
        notes: string | null;
        ingredient: {
          id: number;
          name: string;
          slug: string;
          category: string;
          baseDimension: string;
          baseUnit: string;
          description: string | null;
        } | null;
        subRecipe: {
          id: string;
          title: string;
          baseYield: Decimal;
          yieldUnit: string;
        } | null;
        inventory: {
          currentQuantity: Decimal;
          costPerBaseUnit: Decimal;
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
          type: TagType;
          id: number;
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
