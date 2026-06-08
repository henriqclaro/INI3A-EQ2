import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string('Invalid string for name'),
  tagType: z.enum(['USER', 'PRODUCT', 'VARIETY', 'ATTRIBUTE']),
  creatorId: z.uuid('Invalid UUID for Creator ID')
})