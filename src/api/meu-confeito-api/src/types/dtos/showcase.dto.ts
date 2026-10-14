import type { Decimal } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type * as showcase from '../../validation/showcase.schema';

export namespace ShowcaseDTO {
  // Request DTOs
  export type ParamsRecipe = z.infer<typeof showcase.paramsRecipeSchema>;
  export type ParamsProfile = z.infer<typeof showcase.paramsProfileSchema>;
  export type AddRequest = z.infer<typeof showcase.addShowcaseSchema>;
  export type ReorderRequest = z.infer<typeof showcase.reorderShowcaseSchema>;

  // Entity Interfaces
  export interface ShowcaseItem {
    userId: string;
    recipeId: string;
    order: number | null;
    createdAt: Date;
    recipe: {
      id: string;
      title: string;
      coverUrl: string | null;
      averageRating: Decimal;
      totalReviews: number;
      status?: string;
      updatedAt: Date;
    };
  }

  // Response DTOs
  export interface ShowcaseItemResponse {
    showcaseItem: ShowcaseItem;
  }

  export interface ListResponse {
    showcase: ShowcaseItem[];
  }
}
