import type { Decimal } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type { TagType } from '../../generated/prisma/client';
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
          type: TagType;
          name: string;
          id: number;
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
            id: number;
            type: TagType;
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
      ingredientId: number;
      currentQuantity: Decimal;
      costPerBaseUnit: Decimal;
      expirationDate: Date | null;
      lastUpdated: Date;
      ingredient: {
        id: number;
        name: string;
        slug: string;
        category: string;
        baseDimension: string;
        baseUnit: string;
        description: string | null;
      };
    };
  }

  export interface SelectUserInventoryResponse {
    userInventories: {
      ingredientId: number;
      currentQuantity: Decimal;
      costPerBaseUnit: Decimal;
      expirationDate: Date | null;
      lastUpdated: Date;
      ingredient: {
        id: number;
        name: string;
        slug: string;
        category: string;
        baseDimension: string;
        baseUnit: string;
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
