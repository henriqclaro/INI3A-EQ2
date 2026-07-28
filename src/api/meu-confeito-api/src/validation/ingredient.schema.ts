import { z } from 'zod';

export const registerSchema = z.object({
  parentId: z.uuid('Invalid UUID for Parent ID'),
  name: z
    .array(z.string('Invalid string element for array name'))
    .min(1, 'Name array must have at least 1 element'),
  description: z.string().nullable(),
  category: z.string('Invalid string for category'),
  creatorId: z.uuid('Invalid UUID for Creator ID'),
});

export const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int()),
  search: z.string('Search query must be a single string').trim().optional(),
});
