import { defineConfig } from 'prisma/config';

import POSTGRES_URL from './src/config/url.config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: POSTGRES_URL,
  },
});
