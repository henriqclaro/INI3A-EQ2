import 'dotenv/config';
import { z } from 'zod';

import { envSchema } from '../validation/env.schema';

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid ambient variables: ', z.prettifyError(_env.error));

  process.exit(1);
}

process.env.DATABASE_URL = _env.data.DATABASE_URL;

export const env = _env.data;
