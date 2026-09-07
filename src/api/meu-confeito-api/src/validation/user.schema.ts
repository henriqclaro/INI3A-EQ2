import { z } from 'zod';

export const locationSchema = z.object({
  latitude: z.number('Latitude must be a valid number'),
  longitude: z.number('Logitude must be a valid number'),
});

export const registerSchema = z.object({
  name: z.string().min(3, 'Name must have at least 3 characters'),
  email: z.email('Invalid email format'),
  phone: z.e164('Invalid E164 for phone number').nullish(),
  password: z.string().min(8, 'Password must have at leat 8 characters'),
  role: z.enum(['BAKER', 'CUSTOMER']),
});

export const paramsSchema = z.object({
  id: z.uuid('Invalid UUID for user ID'),
});

export const updateSchema = z
  .object({
    name: z.string().min(3, 'Name must have at least 3 characters'),
    email: z.email('Invalid email format'),
    phone: z.e164('Invalid E164 for phone number'),
    location: locationSchema.nullish(),
    pfpUrl: z.url('Invalid URL for photo'),
    bio: z.string().max(500).nullish(),
    instagram: z.string().max(100).nullish(),
    neighborhood: z.string().max(100).nullish(),
    city: z.string().max(100).nullish(),
  })
  .partial();

export const deleteSchema = z.object({
  state: z.enum(['DELETED', 'SUSPENDED']),
});

export const inventoryRegisterSchema = z.object({
  ingredientId: z.number().int().positive('Ingredient ID must be a positive integer'),
  currentQuantity: z.number().min(0, 'Current quantity cannot be negative').default(0),
  costPerBaseUnit: z.number().min(0, 'Cost per base unit cannot be negative').default(0),
  expirationDate: z.iso.date('Invalid format for expiration date').nullish(),
});

export const saveRecipeSchema = z.object({
  recipeId: z.uuid('Invalid UUID for recipe ID'),
});

export const removeSaveRecipeSchema = z.object({
  recipeId: z.uuid('Invalid UUID for recipe ID'),
});
