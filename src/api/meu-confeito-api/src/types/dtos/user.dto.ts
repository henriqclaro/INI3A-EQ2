import { z } from 'zod';

export namespace UserDTO {
  export const registerSchema = z.object({
    name: z.string().min(3, 'Name must have at least 3 characters'),
    email: z.email('Invalid email format'),
    password: z.string().min(8, 'Password must have at leat 8 characters'),
    role: z.enum(['BAKER', 'CUSTOMER']),
  });

  export type RegisterRequest = z.infer<typeof registerSchema>;

  export interface RegisterResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }
}
