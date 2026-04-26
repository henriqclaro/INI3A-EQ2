import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(3, 'Name must have at least 3 characters'),
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must have at leat 8 characters'),
});

export type RegisterUserRequest = z.infer<typeof registerUserSchema>;
