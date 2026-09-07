import type { Decimal } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type * as user from '../../validation/user.schema';

export namespace UserDTO {
  export type RegisterRequest = z.infer<typeof user.registerSchema>;
  export interface RegisterResponse {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: Date;
    };
  }

  export type RequestParams = z.infer<typeof user.paramsSchema>;

  export interface SelectResponse {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      location: {
        latitude: number;
        longitude: number;
      } | null;
      pfpUrl: string | null;
      role: string;
      updatedAt: Date;
    };
  }

  export type UpdateRequest = z.infer<typeof user.updateSchema>;
  export type UpdateResponse = SelectResponse;

  export type DeleteRequest = z.infer<typeof user.deleteSchema>;

  export interface SelectUserRecipesResponse {
    recipes: {
      id: string;
      title: string;
      coverUrl: string | null;
      /*
      profitMargin: Decimal;
      overhead: Decimal;
      hourlyLabor: Decimal;
      packagingCost: Decimal;
      */
      prepTimeMinutes: number;
      createdAt: Date;
      updatedAt: Date;
      tags: {
        tag: {
          type: string;
          name: string;
          id: string;
        };
      }[];
    }[];
  }

  export interface SelectUserSavesResponse {
    userSaves: {
      recipe: {
        id: string;
        title: string;
        coverUrl: string | null;
        profitMargin: Decimal;
        overhead: Decimal;
        hourlyLabor: Decimal;
        packagingCost: Decimal;
        prepTimeMinutes: number;
        tags: {
          tag: {
            name: string;
            id: string;
            type: string;
          };
        }[];
      };
      savedAt: Date;
    }[];
  }

  export type RegisterUserInventoryRequest = z.infer<typeof user.inventoryRegisterSchema>;

  export interface RegisterUserInventoryResponse {
    userInventory: {
      userId: string;
      ingredientId: string;
      currentQuantity: Decimal;
      measurementUnit: string;
      packagePrice: Decimal;
      packageSize: Decimal;
      costUnit: Decimal;
      lastUpdated: Date;
      ingredient: {
        id: string;
        name: string[];
        category: string;
        description: string | null;
      };
    };
  }

  export interface SelectUserInventoryResponse {
    userInventories: {
      ingredientId: string;
      currentQuantity: Decimal;
      measurementUnit: string;
      packagePrice: Decimal;
      packageSize: Decimal;
      costUnit: Decimal;
      lastUpdated: Date;
      ingredient: {
        id: string;
        name: string[];
        category: string;
        description: string | null;
      };
    }[];
  }

  export type SaveRecipeRequest = z.infer<typeof user.saveRecipeSchema>;
  export interface SaveRecipeResponse {
    userSavedRecipe: {
      userId: string;
      recipeId: string;
      savedAt: Date;
    };
  }

  export type RemoveSaveRecipeRequest = z.infer<typeof user.removeSaveRecipeSchema>;
}
