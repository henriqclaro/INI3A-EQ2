import type { z } from 'zod';

import type * as ingredient from '../../validation/ingredient.schema';

export namespace IngredientDTO {
  export type RegisterRequest = z.infer<typeof ingredient.registerSchema>;
  export interface RegisterResponse {
    ingredient: {
      id: string;
      parentId: string | null;
      name: string[];
      description: string | null;
      category: string;
      creatorId: string | null;
      createdAt: Date;
    };
  }

  export interface SearchResponse {
    ingredients: {
      id: string;
      name: string[];
      description: string | null;
      category: string;
    }[];
  }
}
