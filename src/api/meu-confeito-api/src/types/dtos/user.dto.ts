import type { z } from 'zod';

import type { registerSchema } from '../../validation/user.schema';

export namespace UserDTO {
  export type RegisterRequest = z.infer<typeof registerSchema>;

  export interface RegisterResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  }
}
