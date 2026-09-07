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
  })
  .partial();

export const updateSchema = z
  .object({
    bio: z.string().max(500).nullish(),
    instagram: z.string().max(100).nullish(),
    neighborhood: z.string().max(100).nullish(),
    city: z.string().max(100).nullish(),
    location: locationSchema.nullish(),
  })
  .partial();

export const paramsSchema = z.object({
  id: z.uuid('Invalid UUID for user ID'),
});
