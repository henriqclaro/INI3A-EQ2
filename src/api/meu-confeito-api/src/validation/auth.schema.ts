import { z } from 'zod';

export const logInSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must have at leat 8 characters'),
  clientType: z.string('Client type must be specified'),
  sessionId: z.uuid('Invalid UUID for session ID. Necessary for refresh token creation'),
});

export const headerSchema = z.object({
  authorization: z
    .string('Token missing in header')
    .startsWith('Bearer ', 'Invalid format, use: Bearer <token>'),
  'x-client-type': z.string('Client type must be specified'),
  'x-session-id': z.uuid('Invalid UUID for session ID'),
});

export const refreshOrDeleteSchema = z.object({
  refreshToken: z.string('Token missing'),
});
