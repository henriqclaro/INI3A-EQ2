import { z } from 'zod';

export const registerSchema = z.object({
  userId: z.uuid('Invalid UUID for User ID'),
  parentId: z.uuid('Invalid UUID for Parent ID').nullable(),
  title: z.string('Title is required'),
  coverUrl: z.url('Invalid URL for Cover Image').nullable(),
  intructions: z.json('Invalid JSON for Instructions'),
  baseYield: z.number('Base yield must be a number'),
  yieldUnit: z.string('Yield unit is required'),

  profitMargin: z.number('Profit margin must be a number').optional(),
  overhead: z.number('Overhead must be a number').optional(),
  prepTimeMinutes: z.int('Preparation time must be an integer').optional(),
  hourlyLabor: z.number('Hourly labor must be a number').optional(),
  packagingCost: z.number('Packaging cost must be a number').optional(),
});

export const paramsSchema = z.object({
  id: z.uuid('Invalid UUID for recipe ID'),
});
