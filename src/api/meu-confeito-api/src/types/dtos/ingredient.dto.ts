import type { Decimal } from '@prisma/client/runtime/client';
import type { z } from 'zod';

import type * as ingredient from '../../validation/ingredient.schema';

export namespace IngredientDTO {
  export type RegisterRequest = z.infer<typeof ingredient.registerSchema>;
  export type RequestParam = z.infer<typeof ingredient.paramsSchema>;
  export type QueryRequest = z.infer<typeof ingredient.querySchema>;

  export interface RegisterResponse {
    ingredient: {
      id: number;
      parentId: number | null;
      name: string;
      slug: string;
      aliases: string[];
      description: string | null;
      category: string;
      baseDimension: string;
      baseUnit: string;
      creatorId: string | null;
      createdAt: Date;
      conversions?: {
        id: number;
        fromUnit: string;
        factorToBase: Decimal;
      }[];
    };
  }

  export interface SearchResponse {
    ingredients: {
      id: number;
      name: string;
      slug: string;
      aliases: string[];
      baseDimension: string;
      baseUnit: string;
      category: string;
      description: string | null;
    }[];
  }
}
