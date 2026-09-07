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
    location: locationSchema,
    pfpUrl: z.url('Invalid URL for photo'),
  })
  .partial();

export const deleteSchema = z.object({
  state: z.enum(['DELETED', 'SUSPENDED']),
});

export const inventoryRegisterSchema = z.object({
  ingredientId: z.string('Invalid string for ingredient ID'),
  measurementUnit: z.string('Measurement unit is required'),
  currentQuantity: z.number('Current quantity must be a number').optional(),
  packagePrice: z.number('Package price must be a number').optional(),
  packageSize: z
    .number('Package size must be a number')
    .positive('Package size must be positive')
    .optional(),
  costUnit: z.number('Cost per unit must be a number').optional(),
});

export const saveRecipeSchema = z.object({
  recipeId: z.uuid('Invalid UUID for recipe ID'),
});

export const removeSaveRecipeSchema = z.object({
  recipeId: z.uuid('Invalid UUID for recipe ID'),
});
