import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['dev', 'test', 'production']).default('production'),
    SERVER_PORT: z.coerce.number('Invalid SERVER_PORT').default(3000),
    JWT_SECRET: z
      .string('Invalid JWT_SECRET')
      .min(10, 'JWT_SECRET must have at least 10 characters'),

    DB_USERNAME: z.string('Invalid DB_USERNAME'),
    DB_HOST: z.string('Invalid DB_HOST'),
    DB_PORT: z.coerce.number('Invalid DB_PORT').default(5432),
    DB_DATABASE: z.string('Invalid DB_DATABASE'),
    DB_PASSWORD: z.string('Invalid DB_PASSWORD'),
  })
  .transform((env) => {
    const databaseUrl = `postgresql://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE}?schema=public`;

    return {
      ...env,
      DATABASE_URL: databaseUrl,
    };
  });
