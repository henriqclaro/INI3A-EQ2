import z from 'zod';

export const logInSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must have at leat 8 characters'),
});
