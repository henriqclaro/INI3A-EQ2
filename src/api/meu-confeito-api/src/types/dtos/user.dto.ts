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
      pfpUrl: string | null;
      role: string;
      updatedAt: Date;
    };
  }

  export type UpdateRequest = z.infer<typeof user.updateSchema>;
  export interface UpdateResponse {
    user: {
      name: string;
      email: string;
      phone: string | null;
      pfpUrl: string | null;
      updatedAt: Date;
      isActive: boolean;
    };
  }

  export type DeleteRequest = z.infer<typeof user.deleteSchema>;

  export interface SelectUserRecipesResponse {
    recipes: {
      id: string;
      title: string;
      coverUrl: string | null;
      profitMargin: Decimal;
      overhead: Decimal;
      hourlyLabor: Decimal;
      packagingCost: Decimal;
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
}
