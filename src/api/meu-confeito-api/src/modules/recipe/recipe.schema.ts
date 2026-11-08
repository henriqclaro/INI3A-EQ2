import { z } from 'zod';

export const recipeItemSchema = z
  .object({
    ingredientId: z.number().int().positive().nullable().optional(),
    subRecipeId: z.uuid('Invalid UUID for sub-recipe ID').nullable().optional(),
    quantity: z.number().positive('Quantity must be a positive number'),
    unit: z.enum(['G', 'KG', 'ML', 'L', 'UN']),
    displayQuantity: z.number().positive().nullable().optional(),
    displayUnit: z.string().max(30).nullable().optional(),
    sortOrder: z.number().int().min(0).default(0),
    notes: z.string().max(255).nullable().optional(),
  })
  .refine(
    (data) =>
      (data.ingredientId !== null && data.ingredientId !== undefined) !==
      (data.subRecipeId !== null && data.subRecipeId !== undefined),
    {
      message: 'Recipe item must specify either ingredientId or subRecipeId, but not both',
    },
  );

export const registerSchema = z.object({
  userId: z.uuid('Invalid UUID for User ID').optional(),
  parentId: z.uuid('Invalid UUID for Parent ID').nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  coverUrl: z.url('Invalid URL for Cover Image').nullable().optional(),
  instructions: z.looseObject({}, { error: 'Invalid JSON for Instructions' }),
  baseYield: z.number().positive('Base yield must be positive'),
  yieldUnit: z.enum(['G', 'KG', 'ML', 'L', 'UN']),

  profitMargin: z.number('Profit margin must be a number').optional(),
  overhead: z.number('Overhead must be a number').optional(),
  prepTimeMinutes: z.int('Preparation time must be an integer').optional(),
  hourlyLabor: z.number('Hourly labor must be a number').optional(),
  packagingCost: z.number('Packaging cost must be a number').optional(),

  items: z.array(recipeItemSchema).min(1, 'Recipe must contain at least 1 item'),
  tagIds: z
    .array(z.number().int().positive('Tag ID must be a positive integer'))
    .max(5, 'A recipe can have at most 5 tags')
    .optional(),
});

export const updateSchema = z
  .object({
    title: z.string().min(1, 'Title must have at least 1 character'),
    coverUrl: z.url('Invalid URL for Cover Image').nullable(),
    instructions: z.looseObject({}, { error: 'Invalid JSON for Instructions' }),
    baseYield: z.number().positive('Base yield must be positive'),
    yieldUnit: z.enum(['G', 'KG', 'ML', 'L', 'UN']),

    profitMargin: z.number('Profit margin must be a number'),
    overhead: z.number('Overhead must be a number'),
    prepTimeMinutes: z.int('Preparation time must be an integer'),
    hourlyLabor: z.number('Hourly labor must be a number'),
    packagingCost: z.number('Packaging cost must be a number'),

    items: z.array(recipeItemSchema).min(1, 'Recipe must contain at least 1 item'),
    tagIds: z
      .array(z.number().int().positive('Tag ID must be a positive integer'))
      .max(5, 'A recipe can have at most 5 tags'),
  })
  .partial();

export const paramsSchema = z.object({
  id: z.uuid('Invalid UUID for recipe ID'),
});

export const userInventoryParamsSchema = z.object({
  id: z.uuid('Invalid UUID for recipe ID'),
  userId: z.uuid('Invalid UUID for user ID'),
});

const sortFieldSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const tokens = (Array.isArray(val) ? val : [val])
        .flatMap((item) => item.split(','))
        .map((item) => item.trim())
        .filter(Boolean);

      return tokens.every((token) => {
        const parts = token.toLowerCase().split(':');
        const field = parts[0];
        const dir = parts[1];

        if (!field) return false;

        const isValidField = [
          'rating',
          'ratings',
          'average_rating',
          'stars',
          'highest_rating',
          'reviews',
          'review',
          'most_reviews',
          'ratings_count',
          'saves',
          'saved',
          'favorites',
          'most_saves',
          'newest',
          'recent',
          'created_at',
          'createdat',
          'date',
        ].includes(field);
        const isValidDir = !dir || ['asc', 'desc'].includes(dir);

        return isValidField && isValidDir;
      });
    },
    {
      message: 'Invalid sort parameter. Allowed options are: rating, reviews, saves (and synonyms)',
    },
  );

const dateLimitFieldSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    const num = Number(val);

    return isNaN(num) ? val : num;
  })
  .pipe(
    z
      .number({ error: 'Date limit must be a positive integer' })
      .int('Date limit must be an integer')
      .positive('Date limit must be a positive number of days')
      .optional(),
  );

export const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  search: z.string('Search query must be a single string').trim().optional(),
  sort: sortFieldSchema,
  order: sortFieldSchema,
  orderBy: sortFieldSchema,
  date_limit: dateLimitFieldSchema,
  dateLimit: dateLimitFieldSchema,
  limit_days: dateLimitFieldSchema,
  days: dateLimitFieldSchema,
});

export const updateVisibilitySchema = z.object({
  userId: z.uuid('Invalid UUID for User ID'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SUSPENDED']),
});

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
});
