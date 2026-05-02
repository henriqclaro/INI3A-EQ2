import z from 'zod';

export const logInSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must have at leat 8 characters'),
});

export const headerSchema = z.object({
  authorization: z
    .string('Token missing')
    .startsWith('Bearer ', 'Invalid format. Use: Bearer <token>'),
  'x-client-type': z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string('Token missing'),
});
