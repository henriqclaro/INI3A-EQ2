import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['dev', 'test', 'production']).default('production'),
    SERVER_HOST: z.string('Invalid SERVER_HOST').default('localhost'),
    SERVER_PORT: z.coerce.number('Invalid SERVER_PORT').default(3000),
    BCRYPT_ROUNDS: z.coerce
      .number('Invalid number of salt rounds in BCRYPT_ROUNDS')
      .max(14)
      .default(12),
    JWT_SECRET: z
      .string('Invalid JWT_SECRET')
      .min(10, 'JWT_SECRET must have at least 10 characters'),
    RT_TTL_DAYS: z.coerce.number('Invalid refresh token live time in RT_TTL_DAYS'),
    MAX_ACTIVE_TOKENS: z.coerce
      .number('Invalid MAX_ACTIVE_TOKENS')
      .int('MAX_ACTIVE_TOKENS must be an integer')
      .positive('MAX_ACTIVE_TOKENS must be a positive integer')
      .default(4),
    DB_USERNAME: z.string('Invalid DB_USERNAME'),
    DB_HOST: z.string('Invalid DB_HOST'),
    DB_PORT: z.coerce.number('Invalid DB_PORT').default(5432),
    DB_DATABASE: z.string('Invalid DB_DATABASE'),
    DB_PASSWORD: z.string('Invalid DB_PASSWORD'),
    STORAGE_PATH: z.string('Invalid STORAGE_PATH').default('../storage'),
  })
  .transform((env) => {
    const databaseUrl = `postgresql://${env.DB_USERNAME}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE}?schema=public`;

    return {
      ...env,
      DATABASE_URL: databaseUrl,
    };
  });
