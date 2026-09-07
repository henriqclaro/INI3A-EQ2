import type { z } from 'zod';

import type { TagType } from '../../generated/prisma/client';
import type * as tag from '../../validation/tag.schema';

export namespace TagDTO {
  export type RegisterRequest = z.infer<typeof tag.registerSchema>;
  export interface RegisterResponse {
    tag: {
      id: number;
      name: string;
      type: TagType;
      creatorId: string | null;
      createdAt: Date;
    };
  }

  export type QueryRequest = z.infer<typeof tag.querySchema>;
  export interface SearchResponse {
    tags: {
      id: number;
      name: string;
      type: TagType;
      creatorId: string | null;
      createdAt: Date;
    }[];
  }
}
