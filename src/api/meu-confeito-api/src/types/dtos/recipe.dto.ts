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
      profitMargin?: Decimal;
      overhead?: Decimal;
      prepTimeMinutes?: number;
      hourlyLabor?: Decimal;
      packagingCost?: Decimal;

      createdAt: Date;
    };
  }

  export type RequestParam = z.infer<typeof recipe.paramsSchema>;

  export interface SelectResponse {
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

      profitMargin?: Decimal;
      overhead?: Decimal;
      prepTimeMinutes?: number;
      hourlyLabor?: Decimal;
      packagingCost?: Decimal;

      createdAt: Date;
      updatedAt: Date;
    };
  }
}
