import { z } from 'zod';

export const paramsSchema = z.object({
  id: z.uuid('Invalid UUID for production ID'),
});

export const registerProductionSchema = z.object({
  recipeId: z.uuid('Invalid Recipe ID'),
  yieldProduced: z.number().positive('Yield produced must be greater than zero'),
  expirationDate: z
    .string()
    .date('Invalid date format for expiration date (YYYY-MM-DD)')
    .optional(),
});

export const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive()),
  recipeId: z.uuid('Invalid Recipe ID').optional(),
  includeCanceled: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') return val.toLowerCase() === 'true';
      return undefined;
    })
    .pipe(z.boolean().optional()),
});
