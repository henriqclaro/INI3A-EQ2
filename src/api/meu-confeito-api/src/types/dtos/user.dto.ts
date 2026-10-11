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

  export interface AvatarUploadResponse {
    url: string;
  }

  export interface SelectUserRecipesResponse {
    recipes: {
      id: string;
      parent: {
        id: string;
        title: string;
      } | null;
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

  export type SaveRecipeRequest = z.infer<typeof user.saveRecipeSchema>;
  export interface SaveRecipeResponse {
    userSavedRecipe: {
      userId: string;
      recipeId: string;
      savedAt: Date;
    };
  }

  export type RemoveSaveRecipeRequest = z.infer<typeof user.removeSaveRecipeSchema>;

  export interface SelectUserReviewsResponse {
    reviews: {
      id: string;
      userId: string;
      recipeId: string;
      rating: number;
      createdAt: Date;
      updatedAt: Date;
      recipe: {
        id: string;
        title: string;
        coverUrl: string | null;
        averageRating: Decimal;
        totalReviews: number;
      };
    }[];
  }
}
