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
}
