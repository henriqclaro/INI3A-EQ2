import { z } from 'zod';

export const ingredientSchema = z.object({
  ingredientId: z.uuid('Invalid UUDI for Ingredient ID'),
  baseQuantity: z.number('Ingredient base quantity must be a number'),
  measurementUnit: z.string('Ingredient measurement unit is required'),
  notes: z.string().nullable(),
});

export const registerSchema = z.object({
  userId: z.uuid('Invalid UUID for User ID'),
  parentId: z.uuid('Invalid UUID for Parent ID').nullable(),
  title: z.string('Title is required'),
  coverUrl: z.url('Invalid URL for Cover Image').nullable(),
  instructions: z.looseObject({}, { error: 'Invalid JSON for Instructions' }),
  baseYield: z.number('Base yield must be a number'),
  yieldUnit: z.string('Yield unit is required'),

  profitMargin: z.number('Profit margin must be a number').optional(),
  overhead: z.number('Overhead must be a number').optional(),
  prepTimeMinutes: z.int('Preparation time must be an integer').optional(),
  hourlyLabor: z.number('Hourly labor must be a number').optional(),
  packagingCost: z.number('Packaging cost must be a number').optional(),

  ingredients: z.array(ingredientSchema).min(1, 'Recipe must have at least 1 ingredient'),
});

export const paramsSchema = z.object({
  id: z.uuid('Invalid UUID for recipe ID'),
});

export const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int()),
  search: z.string('Search query must be a single string').trim().optional(),
});
