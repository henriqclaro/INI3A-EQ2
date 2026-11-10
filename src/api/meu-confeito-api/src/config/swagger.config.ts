import { type Express } from 'express';

import swaggerJSDoc, { type Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import z from 'zod';

import * as analytics from '../modules/analytics/analytics.schema';
import * as auth from '../modules/auth/auth.schema';
import * as bakerProfile from '../modules/baker-profile/baker-profile.schema';
import * as ingredient from '../modules/ingredient/ingredient.schema';
import * as inventory from '../modules/inventory/inventory.schema';
import * as production from '../modules/production/production.schema';
import * as recipe from '../modules/recipe/recipe.schema';
import * as showcase from '../modules/showcase/showcase.schema';
import * as tag from '../modules/tag/tag.schema';
import * as user from '../modules/user/user.schema';

const schemas = {
  analytics,
  auth,
  bakerProfile,
  ingredient,
  inventory,
  production,
  recipe,
  showcase,
  tag,
  user,
};

const generateSwaggerSchemas = () => {
  const swaggerComponents: Record<string, any> = {};

  for (const [domainName, domain] of Object.entries(schemas)) {
    for (const [schemaName, schemaValue] of Object.entries(domain as Record<string, any>)) {
      const formattedDomain = domainName.charAt(0).toUpperCase() + domainName.slice(1);

      const formattedSchema = schemaName.charAt(0).toUpperCase() + schemaName.slice(1);

      const swaggerKey = `${formattedDomain}${formattedSchema}`;

      swaggerComponents[swaggerKey] = z.toJSONSchema(schemaValue, { target: 'openapi-3.0' });
    }
  }

  return swaggerComponents;
};

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - Meu Confeito',
      version: '1.0.0',
      description: 'Documentação da API gerada com Swagger JSDoc e Swagger Express UI',
    },
    servers: [
      {
        url: '/api/v1',
      },
    ],
    components: {
      schemas: generateSwaggerSchemas(),
    },
  },
  apis: ['./src/modules/**/*.yaml'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api-docs.json', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
