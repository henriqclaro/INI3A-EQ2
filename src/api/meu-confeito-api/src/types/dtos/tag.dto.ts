import type { z } from 'zod';

import type * as tag from '../../validation/tag.schema';

export namespace TagDTO {
  export type RegisterRequest = z.infer<typeof tag.registerSchema>;
  export interface RegisterResponse {
    tag: {
      id: string;
      name: string;
      type: string;
      createdAt: Date;
      creatorId: string | null;
    };
  }
}
