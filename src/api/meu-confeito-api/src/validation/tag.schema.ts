import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string('Invalid string for name'),
  tagType: z.enum(['USER', 'PRODUCT', 'VARIETY', 'ATTRIBUTE']),
  creatorId: z.uuid('Invalid UUID for Creator ID'),
});

export const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int()),
  search: z.string('Search query must be a single string').trim().optional(),
  type: z.enum(['USER', 'PRODUCT', 'VARIETY', 'ATTRIBUTE']).optional(),
});
