import { z } from 'zod';

export const paramsRecipeSchema = z.object({
  recipeId: z.uuid('Invalid Recipe ID'),
});

export const paramsProfileSchema = z.object({
  id: z.uuid('Invalid Profile ID'),
});

export const addShowcaseSchema = z.object({
  recipeId: z.uuid('Invalid Recipe ID'),
  order: z.number().int().positive('Order must be a positive integer').optional(),
});

export const reorderShowcaseSchema = z.object({
  items: z
    .array(
      z.object({
        recipeId: z.uuid('Invalid Recipe ID'),
        order: z.number().int().positive('Order must be a positive integer'),
      }),
    )
    .min(1, 'Showcase items must contain at least 1 item'),
});
