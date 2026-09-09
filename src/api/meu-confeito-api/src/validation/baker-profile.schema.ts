import { z } from 'zod';

export const locationSchema = z.object({
  latitude: z.number('Latitude must be a valid number'),
  longitude: z.number('Longitude must be a valid number'),
});

export const registerSchema = z
  .object({
    bio: z.string().max(500).nullish(),
    instagram: z.string().max(100).nullish(),
    neighborhood: z.string().max(100).nullish(),
    city: z.string().max(100).nullish(),
    location: locationSchema.nullish(),
    tagIds: z
      .array(z.number().int().positive('Tag ID must be a positive integer'))
      .max(7, 'A baker profile can have at most 7 tags')
      .optional(),
    tags: z
      .array(z.number().int().positive('Tag ID must be a positive integer'))
      .max(7, 'A baker profile can have at most 7 tags')
      .optional(),
  })
  .partial();

export const updateSchema = z
  .object({
    bio: z.string().max(500).nullish(),
    instagram: z.string().max(100).nullish(),
    neighborhood: z.string().max(100).nullish(),
    city: z.string().max(100).nullish(),
    location: locationSchema.nullish(),
    tagIds: z
      .array(z.number().int().positive('Tag ID must be a positive integer'))
      .max(7, 'A baker profile can have at most 7 tags')
      .optional(),
    tags: z
      .array(z.number().int().positive('Tag ID must be a positive integer'))
      .max(7, 'A baker profile can have at most 7 tags')
      .optional(),
  })
  .partial();

export const paramsSchema = z.object({
  id: z.uuid('Invalid UUID for user ID'),
});

export const querySchema = z.object({
  lat: z
    .string({ error: 'Latitude is required' })
    .transform((val) => parseFloat(val))
    .pipe(z.number({ error: 'Latitude must be a valid number' }).min(-90).max(90)),
  lng: z
    .string({ error: 'Longitude is required' })
    .transform((val) => parseFloat(val))
    .pipe(z.number({ error: 'Longitude must be a valid number' }).min(-180).max(180)),
  radius: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? parseFloat(val) : 10000))
    .pipe(z.number({ error: 'Radius must be a positive number' }).positive()),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number({ error: 'Page must be a non-negative integer' }).int().min(0)),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const arr = Array.isArray(val) ? val : [val];
      const cleaned = arr.flatMap((i) => i.split(',').map((t) => t.trim())).filter(Boolean);
      return cleaned.length > 0 ? cleaned : undefined;
    })
    .pipe(z.array(z.string()).optional()),
});
