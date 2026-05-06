import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'Name must have at least 3 characters'),
  email: z.email('Invalid email format'),
  phone: z.e164('Invalid phone number format').nullable(),
  password: z.string().min(8, 'Password must have at leat 8 characters'),
  role: z.enum(['BAKER', 'CUSTOMER']),
});

export const paramsSchema = z.object({
  id: z.uuid('Invalid user ID format'),
});

export const updateSchema = z
  .object({
    name: z.string().min(3, 'Name must have at least 3 characters'),
    email: z.email('Invalid email format'),
    phone: z.e164('Invalid phone number format'),
    pfpUrl: z.url('Invalid photo URL'),
  })
  .partial();

export const deleteSchema = z.object({
  state: z.enum(['DELETED', 'SUSPENDED']),
});
