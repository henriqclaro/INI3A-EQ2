import { defineConfig } from 'prisma/config';

import POSTGRE_URL from './src/config/url.config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: POSTGRE_URL,
  },
});
