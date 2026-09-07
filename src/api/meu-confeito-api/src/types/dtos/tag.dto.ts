import type { z } from 'zod';

import type * as tag from '../../validation/tag.schema';

export namespace TagDTO {
  export type RegisterRequest = z.infer<typeof tag.registerSchema>;
  export interface RegisterResponse {
    tag: {
      id: string;
      name: string;
      type: string;
      creatorId: string | null;
      createdAt: Date;
    };
  }

  export type QueryRequest = z.infer<typeof tag.querySchema>;
  export interface SearchResponse {
    tags: {
      id: string;
      name: string;
      type: string;
      creatorId: string | null;
      createdAt: Date;
    }[];
  }
}
