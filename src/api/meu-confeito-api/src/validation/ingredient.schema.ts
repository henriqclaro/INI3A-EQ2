import { z } from 'zod';

import { isUnitCompatibleWithDimension } from '../utils/unit-conversion.util';

export const registerSchema = z
  .object({
    parentId: z
      .number()
      .int()
      .positive('Parent ID must be a positive integer')
      .nullable()
      .optional(),
    name: z.string().min(2, 'Name must have at least 2 characters').max(100),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, 'Invalid slug format')
      .optional(),
    aliases: z.array(z.string().trim().min(1)).default([]),
    description: z.string().nullable().optional(),
    category: z.string().min(2, 'Category must have at least 2 characters').max(50),
    baseDimension: z.enum(['MASS', 'VOLUME', 'COUNT']),
    baseUnit: z.enum(['G', 'KG', 'ML', 'L', 'UN']),
    conversions: z
      .array(
        z.object({
          fromUnit: z.string().trim().min(1).max(30),
          factorToBase: z.number().positive('Factor must be positive'),
        }),
      )
      .optional(),
  })
  .refine((data) => isUnitCompatibleWithDimension(data.baseUnit, data.baseDimension), {
    message: 'Base unit is not compatible with base dimension',
    path: ['baseUnit'],
  });

export const paramsSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive('Invalid ingredient ID')),
});

export const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int()),
  search: z.string('Search query must be a single string').trim().optional(),
  category: z.string().trim().optional(),
  baseDimension: z.enum(['MASS', 'VOLUME', 'COUNT']).optional(),
});
