import { z } from 'zod';

export const profitSummaryQuerySchema = z
  .object({
    startDate: z.string().date('Invalid start date (expected YYYY-MM-DD)'),
    endDate: z.string().date('Invalid end date (expected YYYY-MM-DD)'),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'startDate must be earlier than or equal to endDate',
    path: ['endDate'],
  });

export const purchaseProjectionSchema = z.object({
  plannedProductions: z
    .array(
      z.object({
        recipeId: z.uuid('Invalid Recipe ID'),
        targetYield: z.number().positive('Target yield must be greater than zero'),
      }),
    )
    .min(1, 'At least one planned production is required'),
});
