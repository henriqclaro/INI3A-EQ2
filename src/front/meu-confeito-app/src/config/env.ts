import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url('Invalid API_URL'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid ambient variables: ', z.prettifyError(_env.error));

  throw new Error();
}

export const env = _env.data;
