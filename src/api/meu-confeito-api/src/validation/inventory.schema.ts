import { z } from 'zod';

export const paramsSchema = z.object({
  ingredientId: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive('Invalid ingredient ID')),
});

export const purchaseSchema = z.object({
  ingredientId: z.number().int().positive('Ingredient ID must be a positive integer'),
  quantity: z.number().positive('Quantity must be a positive number'),
  totalCost: z.number().positive('Total cost must be a positive number'),
  expirationDate: z
    .string()
    .date('Invalid date format for expiration date (YYYY-MM-DD)')
    .optional(),
});

export const adjustmentSchema = z.object({
  ingredientId: z.number().int().positive('Ingredient ID must be a positive integer'),
  realQuantity: z.number().nonnegative('Real quantity cannot be negative'),
  notes: z.string().max(255, 'Notes must be at most 255 characters').optional(),
});

export const wasteSchema = z.object({
  ingredientId: z.number().int().positive('Ingredient ID must be a positive integer'),
  quantity: z.number().positive('Quantity must be a positive number'),
  notes: z.string().max(255, 'Notes must be at most 255 characters').optional(),
});

export const transactionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().positive()),
  ingredientId: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .pipe(z.number().int().positive().optional()),
  transactionType: z
    .enum(['PURCHASE', 'PRODUCTION_USAGE', 'PRODUCTION_REVERSAL', 'WASTE', 'MANUAL_ADJUSTMENT'])
    .optional(),
});
